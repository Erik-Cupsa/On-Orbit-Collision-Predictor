# organization_serializer.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from ..models import Organization
from .cdm_serializer import CDMSerializer  # Adjust the import as needed
from ..permissions import IsAdmin

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    users = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all()
    )
    cdms = CDMSerializer(many=True, read_only=True)

    def update(self, instance, validated_data):
        request = self.context.get("request", None)
        # Only admin (staff) users can override the alert_threshold or users
        if ('alert_threshold' in validated_data) or ('users' in validated_data):
            admin_permission = IsAdmin()
            if not admin_permission.has_permission(request, None):
                # If the request user fails the admin check, raise a ValidationError
                raise serializers.ValidationError({
                    "detail": "Only admin users can modify alert_threshold or manage users."
                })

        return super().update(instance, validated_data)

    class Meta:
        model = Organization
        fields = ('id', 'name', 'alert_threshold', 'users', 'cdms')
