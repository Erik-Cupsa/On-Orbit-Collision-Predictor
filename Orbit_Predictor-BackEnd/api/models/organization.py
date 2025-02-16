from django.db import models
from django.conf import settings
from django.db.models import Q
from .cdm import CDM 

class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    alert_threshold = models.FloatField(default=1.0e-9)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='organizations',
        blank=True
    )
    cdms = models.ManyToManyField(
        CDM,
        related_name='organizations',
        blank=True
    )

    def save(self, *args, **kwargs):
        """
        When saving an Organization, automatically link any CDMs where this org's name
        matches sat1_operator_organization or sat2_operator_organization.
        """
        super().save(*args, **kwargs) 

        # Find all CDMs where either sat1_operator_organization or sat2_operator_organization
        # matches this organization's name.
        matching_cdms = CDM.objects.filter(
            Q(sat1_operator_organization=self.name) | Q(sat2_operator_organization=self.name)
        )
        self.cdms.set(matching_cdms)

    def notify_if_collision_exceeds_threshold(self, collision):
        # TODO: Implement this method
        if collision.probability_of_collision >= self.alert_threshold:
            if collision.cdm in self.cdms.all():
                self.notify_users(collision)

    def notify_users(self, collision):
                # TODO: Implement this method
        for user in self.users.all():
            print(f"Notifying {user.username} about collision {collision}")

    def __str__(self):
        return self.name
