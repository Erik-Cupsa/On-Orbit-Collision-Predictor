from django.db import models
from .conjuction import Conjunction

class Collision(models.Model):
    conjunction_id = models.ForeignKey(Conjunction, on_delete=models.CASCADE, related_name='collisions')
    collision_date = models.DateTimeField()
    risk_factor = models.FloatField()
    sat1_object_designator = models.CharField(max_length=50)
    sat2_object_designator = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        # Ensure satellite IDs are copied from the related Conjunction
        if self.conjunction:
            self.sat1_object_designator = self.conjunction.sat1_object_designator
            self.sat2_object_designator = self.conjunction.sat2_object_designator
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Collision {self.id} between {self.sat1_object_designator} and {self.sat2_object_designator}"