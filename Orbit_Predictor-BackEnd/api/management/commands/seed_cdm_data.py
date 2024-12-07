import os
import json
from django.core.management.base import BaseCommand
from api.models import CDM

class Command(BaseCommand):
    help = "Seeds CDM data from JSON files into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file', type=str, help="Path to the JSON file containing CDM data"
        )

    def handle(self, *args, **options):
        json_file = options['file']
        
        if not json_file:
            self.stdout.write(self.style.ERROR("Please provide a JSON file path using --file"))
            return

        # Check if the file exists
        if not os.path.exists(json_file):
            self.stdout.write(self.style.ERROR(f"File not found: {json_file}"))
            return
        
        # Load the JSON data
        with open(json_file, 'r') as file:
            data = json.load(file)

        # Seed data into the database
        for item in data:
            cdm, created = CDM.objects.update_or_create(
                message_id=item['MESSAGE_ID'],
                defaults={
                    "ccsds_cdm_version": item.get("CCSDS_CDM_VERS"),
                    "creation_date": item.get("CREATION_DATE"),
                    "originator": item.get("ORIGINATOR"),
                    "tca": item.get("TCA"),
                    "miss_distance": float(item.get("MISS_DISTANCE", 0)),

                    # Satellite 1 details
                    "sat1_object": item.get("SAT1_OBJECT"),
                    "sat1_object_designator": item.get("SAT1_OBJECT_DESIGNATOR"),
                    "sat1_maneuverable": item.get("SAT1_MANEUVERABLE"),
                    "sat1_x": float(item.get("SAT1_X", 0)),
                    "sat1_y": float(item.get("SAT1_Y", 0)),
                    "sat1_z": float(item.get("SAT1_Z", 0)),
                    "sat1_x_dot": float(item.get("SAT1_X_DOT", 0)),
                    "sat1_y_dot": float(item.get("SAT1_Y_DOT", 0)),
                    "sat1_z_dot": float(item.get("SAT1_Z_DOT", 0)),

                    # Covariance matrix for Satellite 1
                    "sat1_cov_rr": float(item.get("SAT1_CR_R", 0)),
                    "sat1_cov_rt": float(item.get("SAT1_CT_R", 0)),
                    "sat1_cov_rn": float(item.get("SAT1_CN_R", 0)),
                    "sat1_cov_tr": float(item.get("SAT1_CR_T", 0)),
                    "sat1_cov_tt": float(item.get("SAT1_CT_T", 0)),
                    "sat1_cov_tn": float(item.get("SAT1_CN_T", 0)),
                    "sat1_cov_nr": float(item.get("SAT1_CR_N", 0)),
                    "sat1_cov_nt": float(item.get("SAT1_CT_N", 0)),
                    "sat1_cov_nn": float(item.get("SAT1_CN_N", 0)),

                    # Satellite 2 details
                    "sat2_object": item.get("SAT2_OBJECT"),
                    "sat2_object_designator": item.get("SAT2_OBJECT_DESIGNATOR"),
                    "sat2_maneuverable": item.get("SAT2_MANEUVERABLE"),
                    "sat2_x": float(item.get("SAT2_X", 0)),
                    "sat2_y": float(item.get("SAT2_Y", 0)),
                    "sat2_z": float(item.get("SAT2_Z", 0)),
                    "sat2_x_dot": float(item.get("SAT2_X_DOT", 0)),
                    "sat2_y_dot": float(item.get("SAT2_Y_DOT", 0)),
                    "sat2_z_dot": float(item.get("SAT2_Z_DOT", 0)),

                    # Covariance matrix for Satellite 2
                    "sat2_cov_rr": float(item.get("SAT2_CR_R", 0)),
                    "sat2_cov_rt": float(item.get("SAT2_CT_R", 0)),
                    "sat2_cov_rn": float(item.get("SAT2_CN_R", 0)),
                    "sat2_cov_tr": float(item.get("SAT2_CR_T", 0)),
                    "sat2_cov_tt": float(item.get("SAT2_CT_T", 0)),
                    "sat2_cov_tn": float(item.get("SAT2_CN_T", 0)),
                    "sat2_cov_nr": float(item.get("SAT2_CR_N", 0)),
                    "sat2_cov_nt": float(item.get("SAT2_CT_N", 0)),
                    "sat2_cov_nn": float(item.get("SAT2_CN_N", 0)),

                    # Hard Body Radius (if present in JSON data)
                    "hard_body_radius": float(item.get("HBR", 0)),

                    "privacy": item.get("privacy", False)
                }
            )
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} CDM entry with MESSAGE_ID: {cdm.message_id}"))
        
        self.stdout.write(self.style.SUCCESS("Data seeding completed."))
