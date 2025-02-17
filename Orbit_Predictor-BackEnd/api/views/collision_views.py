from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Collision, CDM
from ..serializers import CollisionSerializer
from pathlib import Path

import matlab.engine
import numpy as np
import scipy.optimize as opt

class CollisionListCreateView(generics.ListCreateAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer

class CollisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer

class CollisionAvoidanceView(APIView):
    """
    This view only scales the speed of satellite 1 in the same direction
    and tries to minimize Pc directly. It does NOT allow direction changes.
    """
    def post(self, request, *args, **kwargs):
        cdm_id = request.data.get("cdm_id")
        Pc_threshold = request.data.get("probability_of_collision", 1e-6)
        
        try:
            cdm = CDM.objects.get(id=cdm_id)
        except CDM.DoesNotExist:
            return Response({"error": "CDM not found."}, 
                            status=status.HTTP_404_NOT_FOUND)

        matlab_path = Path(__file__).resolve().parent.parent / 'matlab'
        eng = matlab.engine.start_matlab()
        eng.addpath(str(matlab_path))
        
        v1 = np.array([cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot])
        base_speed = np.linalg.norm(v1)
        if base_speed < 1e-12:
            eng.quit()
            return Response({"error": "Satellite 1 velocity is near zero; cannot scale speed."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        v1_unit = v1 / base_speed

        def collision_probability(speed):
            v1_new = (speed * v1_unit).tolist()
            prob = eng.Pc2D_Foster(
                matlab.double([cdm.sat1_x, cdm.sat1_y, cdm.sat1_z]),
                matlab.double(v1_new),
                matlab.double([
                    [cdm.sat1_cov_rr, cdm.sat1_cov_rt, cdm.sat1_cov_rn],
                    [cdm.sat1_cov_tr, cdm.sat1_cov_tt, cdm.sat1_cov_tn],
                    [cdm.sat1_cov_nr, cdm.sat1_cov_nt, cdm.sat1_cov_nn]
                ]),
                matlab.double([cdm.sat2_x, cdm.sat2_y, cdm.sat2_z]),
                matlab.double([cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot]),
                matlab.double([
                    [cdm.sat2_cov_rr, cdm.sat2_cov_rt, cdm.sat2_cov_rn],
                    [cdm.sat2_cov_tr, cdm.sat2_cov_tt, cdm.sat2_cov_tn],
                    [cdm.sat2_cov_nr, cdm.sat2_cov_nt, cdm.sat2_cov_nn]
                ]),
                cdm.hard_body_radius,
                1e-8,
                'circle',
                nargout=1
            )
            return float(prob)

        def objective(alpha):
            """
            alpha[0] is the scale factor for speed.
            We simply return the collision probability for that speed.
            """
            speed = alpha[0] * base_speed
            return collision_probability(speed)

        alpha_min = 0.5
        alpha_max = 1.5

        res = opt.minimize(
            objective,
            x0=[1.0],
            bounds=[(alpha_min, alpha_max)],
            method='SLSQP',
            options={'maxiter': 100, 'ftol': 1e-10}
        )

        if not res.success:
            eng.quit()
            return Response({
                "error": "Optimization did not succeed. No feasible speed found to reduce Pc."
            }, status=status.HTTP_400_BAD_REQUEST)

        alpha_opt = res.x[0]
        new_speed = alpha_opt * base_speed
        final_prob = collision_probability(new_speed)
        
        eng.quit()

        if final_prob > Pc_threshold:
            return Response({
                "error": "No speed-only change in the given range can bring Pc below threshold.",
                "best_scale_factor": alpha_opt,
                "best_Pc": final_prob
            }, status=status.HTTP_400_BAD_REQUEST)

        new_v1 = new_speed * v1_unit
        return Response({
            "new_velocity": new_v1.tolist(),
            "scale_factor": alpha_opt,
            "adjusted_speed_m_s": float(new_speed),
            "collision_probability": final_prob,
            "Pc_threshold": Pc_threshold,
        }, status=status.HTTP_200_OK)
