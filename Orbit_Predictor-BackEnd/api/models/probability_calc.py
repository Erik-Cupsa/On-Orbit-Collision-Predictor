from django.db import models
from .cdm import CDM

class ProbabilityCalc(models.Model):
    cdm = models.ForeignKey(CDM, on_delete=models.CASCADE, related_name='probability_calcs')
    probability_value = models.FloatField()
    time_to_impact = models.DurationField()

    def __str__(self):
        return f"ProbabilityCalc {self.id} - CDM {self.cdm.id}"