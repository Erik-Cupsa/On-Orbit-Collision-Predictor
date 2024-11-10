from django.db import models

class CDM(models.Model):
    # Basic Metadata
    ccsds_cdm_version = models.CharField(max_length=10)
    creation_date = models.DateTimeField()
    originator = models.CharField(max_length=50)
    message_id = models.CharField(max_length=100, unique=True)

    # Conjunction Details
    tca = models.DateTimeField()  # Time of Closest Approach
    miss_distance = models.FloatField()  # Minimum distance between the satellites (meters)

    # Satellite 1 Details
    sat1_object = models.CharField(max_length=50)
    sat1_object_designator = models.CharField(max_length=50)
    sat1_maneuverable = models.CharField(max_length=3)  # "YES" or "NO"
    sat1_x = models.FloatField()  # X position
    sat1_y = models.FloatField()  # Y position
    sat1_z = models.FloatField()  # Z position
    sat1_x_dot = models.FloatField()  # X velocity
    sat1_y_dot = models.FloatField()  # Y velocity
    sat1_z_dot = models.FloatField()  # Z velocity

    # Satellite 2 Details
    sat2_object = models.CharField(max_length=50)
    sat2_object_designator = models.CharField(max_length=50)
    sat2_maneuverable = models.CharField(max_length=3)  # "YES" or "NO"
    sat2_x = models.FloatField()  # X position
    sat2_y = models.FloatField()  # Y position
    sat2_z = models.FloatField()  # Z position
    sat2_x_dot = models.FloatField()  # X velocity
    sat2_y_dot = models.FloatField()  # Y velocity
    sat2_z_dot = models.FloatField()  # Z velocity

    def __str__(self):
        return f"CDM {self.message_id} between {self.sat1_object} and {self.sat2_object}"
