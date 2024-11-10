from django.db import models
from .conjuction import Conjunction

class Collision(models.Model):
    conjunction_id = models.ForeignKey(Conjunction, on_delete=models.CASCADE, related_name='collisions')
    collision_date = models.DateTimeField()
    risk_factor = models.FloatField()

    def __str__(self):
        return f"Collision {self.id} - {self.satellite_id}"