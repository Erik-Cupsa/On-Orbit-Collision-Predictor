from django.db import models
from .cdm import CDM

class Conjunction(models.Model):
    cdm_id = models.ForeignKey(CDM, on_delete=models.CASCADE, related_name='conjunctions')
    date = models.DateTimeField()
    risk_factor = models.FloatField()
    description = models.TextField()
    sat1_object_designator = models.CharField(max_length=50)
    sat2_object_designator = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        # Ensure satellite IDs are copied from the related CDM
        if self.cdm:
            self.sat1_object_designator = self.cdm.sat1_object_designator
            self.sat2_object_designator = self.cdm.sat2_object_designator
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Conjunction for CDM {self.cdm.message_id} with ID {self.id} between {self.sat1_object_designator} and {self.sat2_object_designator}"