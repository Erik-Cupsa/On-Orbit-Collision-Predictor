from django.db import models

class Conjunction(models.Model):
    satellite_id = models.CharField(max_length=100)
    date = models.DateTimeField()
    risk_factor = models.FloatField()
    description = models.TextField()

    def __str__(self):
        return f"{self.satellite_id} - {self.date}"