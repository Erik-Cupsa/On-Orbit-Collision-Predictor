from django.db import models
from .conjuction import Conjunction

class ProbabilityCalc(models.Model):
    conjuction = models.ForeignKey(Conjunction, on_delete=models.CASCADE, related_name='probability_calcs')
    probability_value = models.FloatField()
    time_to_impact = models.DurationField()

    def __str__(self):
        return f"ProbabilityCalc {self.id} - Collision {self.collision.id}"