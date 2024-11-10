from django.db import models
from .collision import Collision

class ProbabilityCalc(models.Model):
    collision = models.ForeignKey(Collision, on_delete=models.CASCADE, related_name='probability_calculations')
    probability_value = models.FloatField()
    time_to_impact = models.DurationField()

    def __str__(self):
        return f"ProbabilityCalc {self.id} - Collision {self.collision.id}"