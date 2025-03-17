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
    Demonstrates how to run a tradespace search over maneuver time T and
    maneuver magnitude ΔV, then compute Pc for each combination.
    """

    def post(self, request, *args, **kwargs):
        # 1) Parse request data
        cdm_id = request.data.get("cdm_id")
        if not cdm_id:
            return Response({"error": "cdm_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        cdm = get_object_or_404(CDM, id=cdm_id)

        Pc_threshold = request.data.get("probability_of_collision", 1e-6)

        eng = matlab.engine.start_matlab()
        eng.addpath(str(Path(__file__).resolve().parent.parent / "matlab"))

        # 3) Set up your baseline initial conditions
        r1_init = np.array([cdm.sat1_x, cdm.sat1_y, cdm.sat1_z])
        v1_init = np.array([cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot])

        r2 = np.array([cdm.sat2_x, cdm.sat2_y, cdm.sat2_z])
        v2 = np.array([cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot])

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

        # Hard Body Radius, TCA, etc.
        HBR = cdm.hard_body_radius
        # "circle" is typical for Pc2D_Foster; or "sphere" for 3D approach
        HBRType = 'circle'
        RelTol = 1e-8

        # Time of Closest Approach (TCA)
        tca_datetime = cdm.tca  
        # If "now" is the creation_date or something else, you need Δt
        # For example, in hours:
        #   dt_to_tca_hours = (tca_datetime - current_time).total_seconds() / 3600.0
        # But for demonstration, let's assume we know we can maneuver up to 4 hours prior

        # 4) A function to compute Pc given final R1, V1
        def compute_pc(r1, v1):
            """Calls the MATLAB Pc2D_Foster function for a given state of Sat1 vs Sat2."""
            # Convert everything to matlab.double
            r1_mat = matlab.double(r1.tolist())
            v1_mat = matlab.double(v1.tolist())
            cov1_mat = matlab.double(cov1)
            r2_mat = matlab.double(r2.tolist())
            v2_mat = matlab.double(v2.tolist())
            cov2_mat = matlab.double(cov2)

            prob = eng.Pc2D_Foster(
                r1_mat, v1_mat, cov1_mat,
                r2_mat, v2_mat, cov2_mat,
                HBR, RelTol, HBRType,
                nargout=1
            )
            return float(prob)

        # 5) Naive placeholder for orbital propagation
        #    In reality, you'd replace this with your own function or a call to MATLAB
        #    that does more accurate orbit propagation (e.g. two-body, SGP4, etc.).
        def propagate_satellite(r, v, time_hours):
            """
            A placeholder that does a trivial "coast" ignoring gravity, J2, etc.
            For demonstration only. 
            You would do something like: r(t), v(t) = <some orbit propagation> 
            or a call to eng.propagate_orbit(r, v, time_hours) in MATLAB.
            """
            # Convert hours to seconds
            dt = time_hours * 3600.0
            # r_new = r + v * dt  (completely ignoring gravitational effects for demonstration)
            r_new = r + v * dt
            v_new = v  # not changing if we ignore gravity
            return r_new, v_new

        # 6) Example function to apply an impulsive ΔV in a chosen direction
        def apply_delta_v(v, delta_v_magnitude, direction_unit_vector):
            """
            Return the new velocity vector after applying an instantaneous impulse
            of magnitude delta_v_magnitude along direction_unit_vector.
            """
            return v + delta_v_magnitude * direction_unit_vector

        # For example, let us assume we apply ΔV in the same direction as the current velocity:
        base_speed = np.linalg.norm(v1_init)
        if base_speed < 1e-12:
            eng.quit()
            return Response({"error": "Satellite 1 velocity is near zero; cannot define direction."},
                            status=status.HTTP_400_BAD_REQUEST)
        # Unit direction for the maneuver
        direction_unit_vector = v1_init / base_speed

        # 7) Now define your tradespace ranges
        time_values = np.arange(0.1, 4.1, 0.1)  # 0.1 to 4 hours, step 0.1
        delta_v_values = np.arange(0.01, 1.01, 0.01)  # 0.01 m/s to 1.0 m/s, step 0.01

        best_result = {
            "time_hours": None,
            "delta_v": None,
            "Pc": 1.0e99,
        }

        # 8) Enumerate the tradespace
        for T in time_values:
            # Propagate from "now" to T hours before TCA
            r1_T, v1_T = propagate_satellite(r1_init, v1_init, T)

            for dv in delta_v_values:
                # Apply the instantaneous ΔV at time T
                v1_after_impulse = apply_delta_v(v1_T, dv, direction_unit_vector)

                # Then propagate from T to TCA. Suppose total time from now to TCA is tca_hours.
                # For demonstration, let's assume the total time from now to TCA is 4.0 hours,
                # so we have (4 - T) hours left to go after the burn.
                # (In real code, compute (tca_datetime - current_time).)
                time_from_burn_to_tca = 4.0 - T
                if time_from_burn_to_tca < 0:
                    # If T is beyond 4 hours, skip. This is just demonstration logic.
                    continue

                r1_final, v1_final = propagate_satellite(r1_T, v1_after_impulse, time_from_burn_to_tca)

                # Now we have the final state of Satellite 1 at TCA
                # Relative state is r1_final - r2, v1_final - v2
                # But your Pc function typically just wants r1, v1, r2, v2, so we pass them in.

                pc_value = compute_pc(r1_final, v1_final)
                if pc_value < best_result["Pc"]:
                    best_result["time_hours"] = T
                    best_result["delta_v"] = dv
                    best_result["Pc"] = pc_value

        eng.quit()

        # 9) Check final results
        if best_result["Pc"] > Pc_threshold:
            return Response({
                "message": "No combination in the tradespace brought Pc below the threshold.",
                "best_time_hours": best_result["time_hours"],
                "best_delta_v_m_s": best_result["delta_v"],
                "best_pc": best_result["Pc"],
            }, status=status.HTTP_200_OK)

        return Response({
            "message": "Tradespace search completed.",
            "best_time_hours": best_result["time_hours"],
            "best_delta_v_m_s": best_result["delta_v"],
            "best_pc": best_result["Pc"],
            "Pc_threshold": Pc_threshold,
        }, status=status.HTTP_200_OK)
