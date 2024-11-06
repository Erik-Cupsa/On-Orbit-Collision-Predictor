from django.db import models

class Conjunction(models.Model):
    satellite_id = models.CharField(max_length=100)
    date = models.DateTimeField()
    risk_factor = models.FloatField()
    description = models.TextField()

    def __str__(self):
        return f"{self.satellite_id} - {self.date}"

class Collision(models.Model):
    conjunction = models.ForeignKey(Conjunction, on_delete=models.CASCADE, related_name='collisions')
    satellite_id = models.CharField(max_length=100)
    collision_date = models.DateTimeField()
    risk_factor = models.FloatField()

    def __str__(self):
        return f"Collision {self.id} - {self.satellite_id}"

class ProbabilityCalc(models.Model):
    collision = models.ForeignKey(Collision, on_delete=models.CASCADE, related_name='probability_calculations')
    probability_value = models.FloatField()
    time_to_impact = models.DurationField()

    def __str__(self):
        return f"ProbabilityCalc {self.id} - Collision {self.collision.id}"
