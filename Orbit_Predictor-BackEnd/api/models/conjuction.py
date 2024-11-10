from django.db import models
from .cdm import CDM

class Conjunction(models.Model):
    cdm_id = models.ForeignKey(CDM, on_delete=models.CASCADE, related_name='conjunctions')
    date = models.DateTimeField()
    risk_factor = models.FloatField()
    description = models.TextField()

    def __str__(self):
        return f"{self.satellite_id} - {self.date}"