from pathlib import Path
from django.db import models
from .cdm import CDM
import matlab.engine

class Collision(models.Model):
    cdm = models.ForeignKey(CDM, on_delete=models.CASCADE, related_name='collisions')
    probability_of_collision = models.FloatField()
    sat1_object_designator = models.CharField(max_length=50)
    sat2_object_designator = models.CharField(max_length=50)

    @classmethod
    def create_from_cdm(cls, cdm):
        if not cdm:
            raise ValueError("A valid CDM object must be provided.")
        matlabPathFile = Path(__file__).resolve().parent.parent / 'matlab'

        eng = matlab.engine.start_matlab()
        eng.addpath(str(matlabPathFile))
        r1 = matlab.double([cdm.sat1_x, cdm.sat1_y, cdm.sat1_z])
        v1 = matlab.double([cdm.sat1_x_dot, cdm.sat1_y_dot, cdm.sat1_z_dot])
        cov1 = matlab.double([
            [cdm.sat1_cov_rr, cdm.sat1_cov_rt, cdm.sat1_cov_rn],
            [cdm.sat1_cov_tr, cdm.sat1_cov_tt, cdm.sat1_cov_tn],
            [cdm.sat1_cov_nr, cdm.sat1_cov_nt, cdm.sat1_cov_nn]
        ])

        r2 = matlab.double([cdm.sat2_x, cdm.sat2_y, cdm.sat2_z])
        v2 = matlab.double([cdm.sat2_x_dot, cdm.sat2_y_dot, cdm.sat2_z_dot])
        cov2 = matlab.double([
            [cdm.sat2_cov_rr, cdm.sat2_cov_rt, cdm.sat2_cov_rn],
            [cdm.sat2_cov_tr, cdm.sat2_cov_tt, cdm.sat2_cov_tn],
            [cdm.sat2_cov_nr, cdm.sat2_cov_nt, cdm.sat2_cov_nn]
        ])
        HBR = cdm.hard_body_radius
        RelTol = 1e-08
        HBRType = 'circle'
        probability_of_collision_matlab = eng.Pc2D_Foster(r1, v1, cov1, r2, v2, cov2, HBR, RelTol, HBRType, nargout=1)
        probability_of_collision = float(probability_of_collision_matlab)

        if probability_of_collision > 1.0:
            probability_of_collision = 1.0

        return cls.objects.create(
            cdm=cdm,
            probability_of_collision=probability_of_collision,
            sat1_object_designator=cdm.sat1_object_designator,
            sat2_object_designator=cdm.sat2_object_designator,
        )

    def save(self, *args, **kwargs):
        # Ensure satellite IDs are copied from the related CDM
        if self.cdm:
            self.sat1_object_designator = self.cdm.sat1_object_designator
            self.sat2_object_designator = self.cdm.sat2_object_designator
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Collision {self.id} between {self.sat1_object_designator} and {self.sat2_object_designator}"
