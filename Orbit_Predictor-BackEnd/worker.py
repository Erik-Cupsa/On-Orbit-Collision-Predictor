import matlab.engine
from supabase import create_client, Client
import asyncio
from dotenv import load_dotenv
import os
import django
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orbit_predictor.settings")
django.setup()

from api.models import Collision, CDM

def process_data_with_matlab(r1, v1, cov1, r2, v2, cov2, HBR, RelTol, HBRType):
    logging.info("Starting MATLAB engine")
    # Start the MATLAB engine
    eng = matlab.engine.start_matlab()

    # Add the path to the MATLAB file
    eng.addpath(os.path.join(os.path.dirname(__file__), 'api', 'matlab'))

    # Convert the fields to MATLAB-compatible data types
    r1 = matlab.double(r1)
    v1 = matlab.double(v1)
    cov1 = matlab.double(cov1)
    r2 = matlab.double(r2)
    v2 = matlab.double(v2)
    cov2 = matlab.double(cov2)
    HBR = float(HBR)
    RelTol = float(RelTol)

    # Execute the MATLAB function
    logging.info("Calling MATLAB function Pc2D_Foster")
    Pc, Arem, IsPosDef, IsRemediated = eng.Pc2D_Foster(r1, v1, cov1, r2, v2, cov2, HBR, RelTol, HBRType, nargout=4)
    eng.quit()
    logging.info(f"MATLAB function returned Pc: {Pc}")
    return Pc

def create_collision(cdm, probability_of_collision):
    logging.info(f"Creating Collision object for CDM {cdm.id} with Pc: {probability_of_collision}")
    # Create a new Collision object
    collision = Collision(
        cdm=cdm,
        probability_of_collision=probability_of_collision,
        sat1_object_designator=cdm.sat1_object_designator,
        sat2_object_designator=cdm.sat2_object_designator
    )
    collision.save()
    logging.info(f"Collision object created with ID: {collision.id}")
    return collision

async def main():
    # Create a Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Define a callback function to handle new data
    async def on_new_data(payload):
        logging.info("New data received from Supabase")
        new_data = payload['new']
        cdm_id = new_data['id']
        logging.info(f"Processing CDM with ID: {cdm_id}")
        try:
            cdm = CDM.objects.get(id=cdm_id)
            r1 = [cdm.sat1_x, cdm.sat1_y, cdm.sat1_z]
            v1 = [cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot]
            cov1 = [
                [cdm.sat1_cov_rr, cdm.sat1_cov_rt, cdm.sat1_cov_rn],
                [cdm.sat1_cov_tr, cdm.sat1_cov_tt, cdm.sat1_cov_tn],
                [cdm.sat1_cov_nr, cdm.sat1_cov_nt, cdm.sat1_cov_nn]
            ]
            r2 = [cdm.sat2_x, cdm.sat2_y, cdm.sat2_z]
            v2 = [cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot]
            cov2 = [
                [cdm.sat2_cov_rr, cdm.sat2_cov_rt, cdm.sat2_cov_rn],
                [cdm.sat2_cov_tr, cdm.sat2_cov_tt, cdm.sat2_cov_tn],
                [cdm.sat2_cov_nr, cdm.sat2_cov_nt, cdm.sat2_cov_nn]
            ]
            HBR = cdm.hard_body_radius
            RelTol = 1e-08  # Example tolerance value
            HBRType = 'circle'  # Example HBR type
            probability_of_collision = process_data_with_matlab(r1, v1, cov1, r2, v2, cov2, HBR, RelTol, HBRType)
            create_collision(cdm, probability_of_collision)
        except Exception as e:
            logging.error(f"Error processing CDM with ID {cdm_id}: {e}")

    # Subscribe to the table for new data
    channel = supabase.realtime.channel('realtime:public:api_cdm')
    channel.on('postgres_changes', {'event': 'INSERT', 'schema': 'public', 'table': 'api_cdm'}, on_new_data)
    await channel.subscribe()

    # Keep the script running
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())