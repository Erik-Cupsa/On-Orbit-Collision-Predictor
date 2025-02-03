from django.db import models

class CDM(models.Model):
    # Basic Metadata
    ccsds_cdm_version = models.CharField(max_length=10)
    creation_date = models.DateTimeField()
    originator = models.CharField(max_length=50)
    message_id = models.CharField(max_length=100, unique=True)
    privacy = models.BooleanField(default=True)

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

    # Covariance matrix elements for Satellite 1
    sat1_cov_rr = models.FloatField(null=True, blank=True)  # Covariance rr element
    sat1_cov_rt = models.FloatField(null=True, blank=True)  # Covariance rt element
    sat1_cov_rn = models.FloatField(null=True, blank=True)  # Covariance rn element
    sat1_cov_tr = models.FloatField(null=True, blank=True)  # Covariance tr element
    sat1_cov_tt = models.FloatField(null=True, blank=True)  # Covariance tt element
    sat1_cov_tn = models.FloatField(null=True, blank=True)  # Covariance tn element
    sat1_cov_nr = models.FloatField(null=True, blank=True)  # Covariance nr element
    sat1_cov_nt = models.FloatField(null=True, blank=True)  # Covariance nt element
    sat1_cov_nn = models.FloatField(null=True, blank=True)  # Covariance nn element

    # Additional Satellite 1 Details
    sat1_catalog_name = models.CharField(max_length=100, null=True, blank=True)
    sat1_object_name = models.CharField(max_length=100, null=True, blank=True)
    sat1_international_designator = models.CharField(max_length=100, null=True, blank=True)
    sat1_object_type = models.CharField(max_length=100, null=True, blank=True)
    sat1_operator_organization = models.CharField(max_length=100, null=True, blank=True)
    sat1_covariance_method = models.CharField(max_length=100, null=True, blank=True)
    sat1_reference_frame = models.CharField(max_length=100, null=True, blank=True)

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

    # Additional Satellite 2 Details
    sat2_catalog_name = models.CharField(max_length=100, null=True, blank=True)
    sat2_object_name = models.CharField(max_length=100, null=True, blank=True)
    sat2_international_designator = models.CharField(max_length=100, null=True, blank=True)
    sat2_object_type = models.CharField(max_length=100, null=True, blank=True)
    sat2_operator_organization = models.CharField(max_length=100, null=True, blank=True)
    sat2_covariance_method = models.CharField(max_length=100, null=True, blank=True)
    sat2_reference_frame = models.CharField(max_length=100, null=True, blank=True)

    # Covariance matrix elements for Satellite 2
    sat2_cov_rr = models.FloatField(null=True, blank=True)  # Covariance rr element
    sat2_cov_rt = models.FloatField(null=True, blank=True)  # Covariance rt element
    sat2_cov_rn = models.FloatField(null=True, blank=True)  # Covariance rn element
    sat2_cov_tr = models.FloatField(null=True, blank=True)  # Covariance tr element
    sat2_cov_tt = models.FloatField(null=True, blank=True)  # Covariance tt element
    sat2_cov_tn = models.FloatField(null=True, blank=True)  # Covariance tn element
    sat2_cov_nr = models.FloatField(null=True, blank=True)  # Covariance nr element
    sat2_cov_nt = models.FloatField(null=True, blank=True)  # Covariance nt element
    sat2_cov_nn = models.FloatField(null=True, blank=True)  # Covariance nn element

    # Hard Body Radius
    hard_body_radius = models.FloatField(default=20)  # Hard Body Radius (HBR)

    def __str__(self):
        return f"CDM {self.message_id} between {self.sat1_object} and {self.sat2_object}"
