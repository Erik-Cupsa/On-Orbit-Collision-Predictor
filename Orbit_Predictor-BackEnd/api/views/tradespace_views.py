from pathlib import Path
import numpy as np
import matlab.engine
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404
from ..models import CDM

class CollisionTradespaceView(APIView):
    """
    Demonstrates a tradespace search over maneuver time T and ΔV magnitude,
    then computes Pc for each combination. This version returns extra info,
    including original and final states as well as initial positions.
    """

    def post(self, request, *args, **kwargs):
        # 1) Parse request data
        cdm_id = request.data.get("cdm_id")
        if not cdm_id:
            return Response(
                {"error": "cdm_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cdm = get_object_or_404(CDM, id=cdm_id)

        Pc_threshold = float(request.data.get("probability_of_collision", 1e-6))

        # 2) Start MATLAB and add MATLAB path
        eng = matlab.engine.start_matlab()
        eng.addpath(str(Path(__file__).resolve().parent.parent / "matlab"))

        # 3) Baseline initial conditions for Satellite 1 (from CDM)
        r1_init = np.array([cdm.sat1_x, cdm.sat1_y, cdm.sat1_z])
        v1_init = np.array([cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot])

        # Satellite 2 (kept static in this naive example)
        r2_init = np.array([cdm.sat2_x, cdm.sat2_y, cdm.sat2_z])
        v2_init = np.array([cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot])

        # Covariance matrices for each satellite
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

        # Hard Body Radius and settings
        HBR = cdm.hard_body_radius
        HBRType = 'circle'
        RelTol = 1e-8

        # 4) Function to compute Pc using MATLAB
        def compute_pc(r1, v1):
            r1_mat = matlab.double(r1.tolist())
            v1_mat = matlab.double(v1.tolist())
            cov1_mat = matlab.double(cov1)

            r2_mat = matlab.double(r2_init.tolist())
            v2_mat = matlab.double(v2_init.tolist())
            cov2_mat = matlab.double(cov2)

            prob = eng.Pc2D_Foster(
                r1_mat, v1_mat, cov1_mat,
                r2_mat, v2_mat, cov2_mat,
                HBR, RelTol, HBRType,
                nargout=1
            )
            return float(prob)

        # 5) Naive orbital propagation (simple linear "coast")
        def propagate_satellite(r, v, time_hours):
            dt = time_hours * 3600.0
            r_new = r + v * dt
            v_new = v  # velocity remains constant (no gravitational effects)
            return r_new, v_new

        # 6) Determine maneuver direction (using Satellite 1's velocity)
        base_speed = np.linalg.norm(v1_init)
        if base_speed < 1e-12:
            eng.quit()
            return Response(
                {"error": "Satellite 1 velocity is near zero; cannot define direction."},
                status=status.HTTP_400_BAD_REQUEST
            )
        direction_unit_vector = v1_init / base_speed

        # 7) Define tradespace ranges (can be optionally provided by request)
        time_values = np.arange(0.1, 4.1, 0.1)      # 0.1 to 4.0 hours
        delta_v_values = np.arange(0.01, 1.01, 0.01)  # 0.01 to 1.0 m/s

        # 8) Compute the original Pc with no maneuver
        original_pc = compute_pc(r1_init, v1_init)

        # 9) Initialize best result storage
        best_result = {
            "time_hours": None,
            "delta_v": None,
            "Pc": 1.0e99,
            "r1_final": None,
            "v1_final": None,
        }

        # 10) Enumerate the tradespace
        for T in time_values:
            # Propagate Satellite 1 to T hours before TCA
            r1_T, v1_T = propagate_satellite(r1_init, v1_init, T)

            for dv in delta_v_values:
                # Apply the instantaneous ΔV (impulse)
                v1_after_impulse = v1_T + dv * direction_unit_vector

                # Propagate from the burn time to TCA (assuming total window is 4 hours)
                time_from_burn_to_tca = 4.0 - T
                if time_from_burn_to_tca < 0:
                    continue

                r1_final, v1_final = propagate_satellite(r1_T, v1_after_impulse, time_from_burn_to_tca)
                pc_value = compute_pc(r1_final, v1_final)

                # Update best result if a lower Pc is found
                if pc_value < best_result["Pc"]:
                    best_result["time_hours"] = T
                    best_result["delta_v"] = dv
                    best_result["Pc"] = pc_value
                    best_result["r1_final"] = r1_final
                    best_result["v1_final"] = v1_final

        eng.quit()

        # 11) Build final response with additional details, including initial states.
        response_data = {
            "message": "Tradespace search completed.",
            "original_pc": original_pc,
            "Pc_threshold": Pc_threshold,
            "initial_sat1_position": r1_init.tolist(),
            "initial_sat1_velocity": v1_init.tolist(),
            "initial_sat2_position": r2_init.tolist(),
            "initial_sat2_velocity": v2_init.tolist(),
            "best_time_hours": best_result["time_hours"],
            "best_delta_v_m_s": best_result["delta_v"],
            "best_pc": best_result["Pc"],
            "final_sat1_position": best_result["r1_final"].tolist() if best_result["r1_final"] is not None else None,
            "final_sat1_velocity": best_result["v1_final"].tolist() if best_result["v1_final"] is not None else None,
            # Satellite 2 is not propagated, so its final state remains its initial state
            "final_sat2_position": r2_init.tolist(),
            "final_sat2_velocity": v2_init.tolist()
        }

        # If no combination reduced Pc below the threshold, adjust message accordingly.
        if best_result["Pc"] > Pc_threshold:
            response_data["message"] = "No combination in the tradespace brought Pc below the threshold."

        return Response(response_data, status=status.HTTP_200_OK)
