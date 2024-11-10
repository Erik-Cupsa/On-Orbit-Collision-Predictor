from django.db import models
from .conjuction import Conjunction

class Collision(models.Model):
    conjunction = models.ForeignKey(Conjunction, on_delete=models.CASCADE, related_name='collisions')
    satellite_id = models.CharField(max_length=100)
    collision_date = models.DateTimeField()
    risk_factor = models.FloatField()

    def __str__(self):
        return f"Collision {self.id} - {self.satellite_id}"