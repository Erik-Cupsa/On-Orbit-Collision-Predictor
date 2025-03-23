from pathlib import Path
import numpy as np
import matlab.engine
import requests
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Skyfield + two-body integrator
from skyfield.api import load, EarthSatellite
from scipy.integrate import solve_ivp

from ..models import CDM, Collision

# Earth's gravitational parameter in SI units (m^3/s^2)
MU = 3.986004418e14

def fetch_tle(satellite_id):
    """
    Fetches the TLE lines for a given satellite from CelesTrak.
    If the first line does not start with '1 ', we treat it as a name line and skip it.
    Returns the two TLE lines if successful, otherwise None.
    """
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={satellite_id}&FORMAT=TLE"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None
        # Strip empty lines
        lines = [line.strip() for line in response.text.splitlines() if line.strip()]
        # If the first line does not start with '1 ', assume it is a name line and skip it
        if lines and not lines[0].startswith('1'):
            tle_lines = lines[1:3]
        else:
            tle_lines = lines[:2]
        return tle_lines if len(tle_lines) == 2 else None
    except Exception:
        return None

def propagate_satellite_sgp4(sat, time_hours):
    """
    Propagates a satellite using Skyfield's SGP4 model.
    :param sat: EarthSatellite object
    :param time_hours: time offset from "now" in hours
    :return: (position, velocity) in meters and m/s.
    """
    ts = load.timescale()
    # Convert hours to days
    t = ts.now() + time_hours / 24.0
    geocentric = sat.at(t)

    # Position in km, velocity in km/s
    r_km = geocentric.position.km
    v_km_s = geocentric.velocity.km_per_s

    # Convert to SI
    r_m = np.array(r_km) * 1000.0
    v_m_s = np.array(v_km_s) * 1000.0
    return r_m, v_m_s

def two_body_ode(t, state):
    """
    Two-body differential equation: d state / dt for [rx, ry, rz, vx, vy, vz].
    """
    r = state[:3]
    v = state[3:]
    r_norm = np.linalg.norm(r)
    # Acceleration due to gravity
    a = -MU * r / (r_norm**3)
    return [v[0], v[1], v[2], a[0], a[1], a[2]]

def propagate_satellite_two_body(r0, v0, dt_seconds):
    """
    Propagates a satellite under two-body dynamics over dt_seconds (in seconds).
    Uses an RK45 numerical integration from scipy.
    :param r0: initial position (meters)
    :param v0: initial velocity (m/s)
    :param dt_seconds: propagation time in seconds
    :return: (r_final, v_final)
    """
    state0 = np.concatenate([r0, v0])
    sol = solve_ivp(two_body_ode, [0, dt_seconds], state0, method='RK45',
                    rtol=1e-9, atol=1e-9)
    final_state = sol.y[:, -1]
    r_final = final_state[:3]
    v_final = final_state[3:]
    return r_final, v_final

class CollisionTradespaceView(APIView):
    """
    Demonstrates a tradespace search over maneuver time (T) and ΔV magnitude,
    but only applies the maneuver to Satellite 1. Satellite 2 remains
    in its natural trajectory (SGP4).
    """

    def post(self, request, *args, **kwargs):
        # 1) Parse request data
        cdm_id = request.data.get("cdm_id")
        if not cdm_id:
            return Response(
                {"error": "cdm_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Probability threshold
        Pc_threshold = float(request.data.get("probability_of_collision", 1e-6))

        # 2) Retrieve the CDM
        cdm = get_object_or_404(CDM, id=cdm_id)

        # 3) Start MATLAB for collision probability computations
        eng = matlab.engine.start_matlab()
        eng.addpath(str(Path(__file__).resolve().parent.parent / "matlab"))

        # 4) Fetch TLEs for both satellites
        sat1_tle = fetch_tle(cdm.sat1_object_designator)
        sat2_tle = fetch_tle(cdm.sat2_object_designator)
        if not sat1_tle or not sat2_tle:
            eng.quit()
            return Response(
                {"error": "Failed to fetch TLE data for one or both satellites."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Skyfield EarthSatellite objects
        ts = load.timescale()
        sat1 = EarthSatellite(sat1_tle[0], sat1_tle[1], 'SAT1', ts)
        sat2 = EarthSatellite(sat2_tle[0], sat2_tle[1], 'SAT2', ts)

        # 5) Determine an initial state for Satellite 1 (time=0)
        r1_init, v1_init = propagate_satellite_sgp4(sat1, 0.0)
        base_speed = np.linalg.norm(v1_init)
        if base_speed < 1e-12:
            eng.quit()
            return Response(
                {"error": "Satellite 1 velocity is near zero; cannot define maneuver direction."},
                status=status.HTTP_400_BAD_REQUEST
            )
        direction_unit_vector = v1_init / base_speed

        # 6) Covariance matrices from the CDM
        cov1 = [
            [cdm.sat1_cov_rr, cdm.sat1_cov_rt, cdm.sat1_cov_rn],
            [cdm.sat1_cov_tr, cdm.sat1_cov_tt, cdm.sat1_cov_tn],
            [cdm.sat1_cov_nr, cdm.sat1_cov_nt, cdm.sat1_cov_nn],
        ]
        cov2 = [
            [cdm.sat2_cov_rr, cdm.sat2_cov_rt, cdm.sat2_cov_rn],
            [cdm.sat2_cov_tr, cdm.sat2_cov_tt, cdm.sat2_cov_tn],
            [cdm.sat2_cov_nr, cdm.sat2_cov_nt, cdm.sat2_cov_nn],
        ]

        # Hard Body Radius and settings for Pc computation
        HBR = cdm.hard_body_radius
        HBRType = 'circle'
        RelTol = 1e-8

        # 7) Function to compute Pc using the final states of Satellite 1
        #    and the final state of Satellite 2 (propagated purely by SGP4 to TCA).
        def compute_pc(r1, v1):
            r1_mat = matlab.double(r1.tolist())
            v1_mat = matlab.double(v1.tolist())
            cov1_mat = matlab.double(cov1)

            # Propagate Satellite 2 to TCA with SGP4
            r2, v2 = propagate_satellite_sgp4(sat2, 4.0)
            r2_mat = matlab.double(r2.tolist())
            v2_mat = matlab.double(v2.tolist())
            cov2_mat = matlab.double(cov2)

            prob = float(eng.Pc2D_Foster(
                r1_mat, v1_mat, cov1_mat,
                r2_mat, v2_mat, cov2_mat,
                HBR, RelTol, HBRType,
                nargout=1
            ))
            return prob
        

        # 8) Define tradespace ranges
        time_values = np.arange(0.1, 4.1, 0.1)      # Burn time from 0.1 to 4.0 hours
        delta_v_values = np.arange(0.01, 1.01, 0.01)  # ΔV from 0.01 to 1.0 m/s

        # 9) Get original Pc
        collision_record = None
        collision_record = Collision.objects.get(cdm_id=cdm_id)
        original_pc = collision_record.probability_of_collision

        # 10) Initialize best result storage
        best_result = {
            "time_hours": None,
            "delta_v": None,
            "Pc": 1e99,
            "r1_final": None,
            "v1_final": None
        }

        # 11) Enumerate the tradespace
        for T in time_values:
            # Propagate Satellite 1 to the burn time T (SGP4)
            r1_burn, v1_burn = propagate_satellite_sgp4(sat1, T)

            for dv in delta_v_values:
                # Apply the instantaneous ΔV
                v1_after_impulse = v1_burn + dv * direction_unit_vector

                # Time left from burn to TCA
                time_from_burn_to_tca = 4.0 - T
                if time_from_burn_to_tca < 0:
                    continue
                dt_seconds = time_from_burn_to_tca * 3600.0

                # Propagate Satellite 1 from burn to TCA with two-body dynamics
                r1_final, v1_final = propagate_satellite_two_body(r1_burn, v1_after_impulse, dt_seconds)

                # Compute Pc with final Satellite 1 state and final Satellite 2 state (SGP4)
                pc_value = compute_pc(r1_final, v1_final)

                # Update the best result if this Pc is lower
                if pc_value < best_result["Pc"]:
                    best_result["time_hours"] = T
                    best_result["delta_v"] = dv
                    best_result["Pc"] = pc_value
                    best_result["r1_final"] = r1_final
                    best_result["v1_final"] = v1_final

        eng.quit()

        response_data = {
            "message": "Tradespace search completed.",
            "original_pc": original_pc,
            "Pc_threshold": Pc_threshold,
            "initial_sat1_position": r1_init.tolist(),
            "initial_sat1_velocity": v1_init.tolist(),
            "initial_sat2_position": propagate_satellite_sgp4(sat2, 0.0)[0].tolist(),
            "initial_sat2_velocity": propagate_satellite_sgp4(sat2, 0.0)[1].tolist(),
            "best_time_hours": best_result["time_hours"],
            "best_delta_v_m_s": best_result["delta_v"],
            "best_pc": f"{best_result["Pc"]:.8e}",
            "final_sat1_position": (
                best_result["r1_final"].tolist() if best_result["r1_final"] is not None else None
            ),
            "final_sat1_velocity": (
                best_result["v1_final"].tolist() if best_result["v1_final"] is not None else None
            ),
            # Satellite 2 is unmanipulated, so we simply propagate it to TCA via SGP4:
            "final_sat2_position": propagate_satellite_sgp4(sat2, 4.0)[0].tolist(),
            "final_sat2_velocity": propagate_satellite_sgp4(sat2, 4.0)[1].tolist(),
        }

        if best_result["Pc"] > Pc_threshold:
            response_data["message"] = "No combination in the tradespace brought Pc below the threshold."

        return Response(response_data, status=status.HTTP_200_OK)
