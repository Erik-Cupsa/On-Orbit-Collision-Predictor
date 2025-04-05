import numpy as np
import matlab.engine
from pathlib import Path
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import CDM, Collision

class CollisionTradespaceView(APIView):
    """
    Computes a tradespace of maneuvers for Satellite 1 using direct equations:
      +Va = Va + Δv * Va_hat  
      +Ra = Ra - 3 * Δv * T * (+Va)  
      RRel = Rd - (+Ra)  
      VRel = Vd - (+Va)  
      Rmiss = RRel - ((RRel · VRel)/||VRel||²)*VRel
    Only Satellite 1 is maneuvered. The view returns:
      - "original": The original (baseline) collision probability, miss distance, and satellite states.
      - "best_maneuver": The overall best maneuver result.
      - "heatmap_data": A list of objects for each combination of T and Δv, where each object includes:
            "T_hours": time before TCA,
            "dv": Δv,
            "miss_distance": computed miss distance,
            "pc": computed collision probability.
      
    No orbital propagation is performed.
    """
    def post(self, request, *args, **kwargs):
        # 1) Parse request data
        cdm_id = request.data.get("cdm_id")
        if not cdm_id:
            return Response({"error": "cdm_id is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 2) Retrieve the CDM instance (assumed to have states at TCA)
        cdm = get_object_or_404(CDM, id=cdm_id)

        # Satellite 1 (primary) initial state
        Ra = np.array([cdm.sat1_x, cdm.sat1_y, cdm.sat1_z], dtype=float)
        Va = np.array([cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot], dtype=float)

        # Satellite 2 (secondary) initial state
        Rd = np.array([cdm.sat2_x, cdm.sat2_y, cdm.sat2_z], dtype=float)
        Vd = np.array([cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot], dtype=float)

        # Build covariance matrices for MATLAB
        cov1 = [
            [cdm.sat1_cov_rr, cdm.sat1_cov_rt, cdm.sat1_cov_rn],
            [cdm.sat1_cov_tr, cdm.sat1_cov_tt, cdm.sat1_cov_tn],
            [cdm.sat1_cov_nr, cdm.sat1_cov_nt, cdm.sat1_cov_nn]
        ]
        cov2 = [
            [cdm.sat2_cov_rr, cdm.sat2_cov_rt, cdm.sat2_cov_rn],
            [cdm.sat2_cov_tr, cdm.sat2_cov_tt, cdm.sat2_cov_tn],
            [cdm.sat2_cov_nr, cdm.sat2_cov_nt, cdm.sat2_cov_nn]
        ]

        # MATLAB parameters
        HBR = cdm.hard_body_radius
        RelTol = 1e-8
        HBRType = 'circle'

        # Start MATLAB engine and add MATLAB scripts path
        eng = matlab.engine.start_matlab()
        matlab_path = Path(__file__).resolve().parent.parent / "matlab"
        eng.addpath(str(matlab_path))

        # Helper: Compute collision probability via MATLAB
        def compute_pc(r1, v1):
            r1_mat = matlab.double(r1.tolist())
            v1_mat = matlab.double(v1.tolist())
            cov1_mat = matlab.double(cov1)
            # Use Satellite 2's unchanged state
            r2_mat = matlab.double(Rd.tolist())
            v2_mat = matlab.double(Vd.tolist())
            cov2_mat = matlab.double(cov2)
            prob = float(eng.Pc2D_Foster(
                r1_mat, v1_mat, cov1_mat,
                r2_mat, v2_mat, cov2_mat,
                HBR, RelTol, HBRType,
                nargout=1
            ))
            return prob

        # Compute baseline relative state and miss distance
        RRel_orig = Rd - Ra
        VRel_orig = Vd - Va
        VRel_orig_mag_sq = np.dot(VRel_orig, VRel_orig)
        if VRel_orig_mag_sq < 1e-12:
            Rmiss_orig = RRel_orig
        else:
            proj_factor_orig = np.dot(RRel_orig, VRel_orig) / VRel_orig_mag_sq
            Rmiss_orig = RRel_orig - proj_factor_orig * VRel_orig
        miss_distance_orig = np.linalg.norm(Rmiss_orig)
        original_pc = compute_pc(Ra, Va)

        # Define tradespace:
        # Δv from -0.10 to +0.10 m/s (0.01 m/s steps)
        # T from 24 hr to 0 hr (in 0.25-hr decrements)
        dv_values = np.arange(-0.10, 0.10 + 1e-9, 0.01)
        time_values = np.arange(24.0, -1e-9, -0.25)

        # Compute unit vector for Va
        Va_norm = np.linalg.norm(Va)
        if Va_norm < 1e-12:
            eng.quit()
            return Response({"error": "Satellite 1 velocity is near zero."},
                            status=status.HTTP_400_BAD_REQUEST)
        Va_hat = Va / Va_norm

        # Initialize overall best maneuver result and heatmap data list.
        best_result = {
            "T_hours_before_TCA": None,
            "delta_v_m_s": None,
            "pc_value": np.inf,
            "miss_distance": None,
            "sat1_final_position": None,
            "sat1_final_velocity": None
        }
        heatmap_data = []  # Each element: { "T_hours": T, "dv": dv, "miss_distance": ..., "pc": ... }

        # Loop over time values and Δv values
        for T in time_values:
            for dv in dv_values:
                # Apply direct equations:
                # New velocity: +Va = Va + Δv * Va_hat
                Va_plus = Va + dv * Va_hat
                # New position: +Ra = Ra - 3 * Δv * T * (+Va)
                Ra_plus = Ra - 3.0 * dv * T * 3600 * Va_plus

                # Compute new relative state (Satellite 2 unchanged)
                RRel = Rd - Ra_plus
                VRel = Vd - Va_plus

                # Compute miss distance vector and magnitude
                VRel_mag_sq = np.dot(VRel, VRel)
                if VRel_mag_sq < 1e-12:
                    Rmiss_vec = RRel
                else:
                    proj_factor = np.dot(RRel, VRel) / VRel_mag_sq
                    Rmiss_vec = RRel - proj_factor * VRel
                miss_distance = np.linalg.norm(Rmiss_vec)

                # Compute collision probability via MATLAB
                pc_value = compute_pc(Ra_plus, Va_plus)

                # Record the result in the heatmap_data
                heatmap_data.append({
                    "T_hours": float(T),
                    "dv": float(dv),
                    "miss_distance": float(miss_distance),
                    "pc": float(pc_value)
                })

                # Update overall best maneuver if this combination is better
                if pc_value < best_result["pc_value"]:
                    best_result = {
                        "T_hours_before_TCA": float(T),
                        "delta_v_m_s": float(dv),
                        "pc_value": float(pc_value),
                        "miss_distance": float(miss_distance),
                        "sat1_final_position": Ra_plus.tolist(),
                        "sat1_final_velocity": Va_plus.tolist()
                    }

        eng.quit()

        response_data = {
            "original": {
                "sat1_initial_position": Ra.tolist(),
                "sat1_initial_velocity": Va.tolist(),
                "sat2_initial_position": Rd.tolist(),
                "sat2_initial_velocity": Vd.tolist(),
                "miss_distance": float(miss_distance_orig),
                "pc_value": float(original_pc)
            },
            "best_maneuver": best_result,
            "heatmap_data": heatmap_data
        }

        return Response(response_data, status=status.HTTP_200_OK)