# api/serializers.py

import jwt
import datetime
from django.conf import settings
from rest_framework import serializers

from ..models import User, CDM

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    registration_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # NEW: Allow setting 'interested_cdms' by passing a list of CDM IDs
    interested_cdms = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=CDM.objects.all(),
        required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'password', 
            'role', 
            'registration_code', 
            'created_at',
            'interested_cdms'   # NEW FIELD
        ]
        read_only_fields = ['id', 'created_at']

    def validate_registration_code(self, value):
        """
        Validate the registration code if provided.
        """
        if value and value != settings.ADMIN_REGISTRATION_CODE:
            raise serializers.ValidationError('Invalid registration code.')
        return value

    def create(self, validated_data):
        registration_code = validated_data.pop('registration_code', None)
        email = validated_data.get('email', '')
        domain = email.split('@')[-1].lower()

        # Determine role based on email domain and registration code
        role = 'user'  # Default role
        if domain == 'asc-csa.gc.ca':
            if registration_code:
                role = 'admin'
            else:
                role = 'collision_analyst'

        validated_data['role'] = role

        # Extract password separately
        password = validated_data.pop('password')
        
        # Extract any CDM IDs passed in
        interested_cdms = validated_data.pop('interested_cdms', [])

        user = User.objects.create_user(password=password, **validated_data)

        # If the user provided interested CDMs during registration, set them
        if interested_cdms:
            user.interested_cdms.set(interested_cdms)

        return user

    def update(self, instance, validated_data):
        # Handle interested_cdms updates
        interested_cdms = validated_data.pop('interested_cdms', None)
        if interested_cdms is not None:
            instance.interested_cdms.set(interested_cdms)

        # Handle password updates (if provided)
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    access_token = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials')

        now = datetime.datetime.utcnow()

        access_payload = {
            'user_id': str(user.id),
            'role': user.role,  # Include role in the payload
            'exp': now + settings.JWT_ACCESS_EXPIRATION_DELTA,
            'iat': now,
        }

        refresh_payload = {
            'user_id': str(user.id),
            'role': user.role,
            'exp': now + settings.JWT_REFRESH_EXPIRATION_DELTA,
            'iat': now,
        }

        access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm='HS256')
        refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
        }


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

    def validate(self, data):
        refresh_token = data.get('refresh_token')

        try:
            payload = jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise serializers.ValidationError('Refresh token has expired.')
        except jwt.InvalidTokenError:
            raise serializers.ValidationError('Invalid refresh token.')

        user_id = payload.get('user_id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError('User does not exist.')

        now = datetime.datetime.utcnow()

        new_access_payload = {
            'user_id': str(user.id),
            'role': user.role,
            'exp': now + settings.JWT_ACCESS_EXPIRATION_DELTA,
            'iat': now,
        }

        new_access_token = jwt.encode(new_access_payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return {
            'access_token': new_access_token
        }


class CDMSerializer(serializers.ModelSerializer):
    class Meta:
        model = CDM
        fields = [
            'id',
            'ccsds_cdm_version',
            'creation_date',
            'originator',
            'message_id',
            'privacy',
            'tca',
            'miss_distance',
            # Satellite 1
            'sat1_object',
            'sat1_object_designator',
            'sat1_maneuverable',
            'sat1_x',
            'sat1_y',
            'sat1_z',
            'sat1_x_dot',
            'sat1_y_dot',
            'sat1_z_dot',
            'sat1_cov_rr',
            'sat1_cov_rt',
            'sat1_cov_rn',
            'sat1_cov_tr',
            'sat1_cov_tt',
            'sat1_cov_tn',
            'sat1_cov_nr',
            'sat1_cov_nt',
            'sat1_cov_nn',
            # Satellite 2
            'sat2_object',
            'sat2_object_designator',
            'sat2_maneuverable',
            'sat2_x',
            'sat2_y',
            'sat2_z',
            'sat2_x_dot',
            'sat2_y_dot',
            'sat2_z_dot',
            'sat2_cov_rr',
            'sat2_cov_rt',
            'sat2_cov_rn',
            'sat2_cov_tr',
            'sat2_cov_tt',
            'sat2_cov_tn',
            'sat2_cov_nr',
            'sat2_cov_nt',
            'sat2_cov_nn',
            'hard_body_radius',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        return CDM.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field in self.Meta.fields:
            if field != 'id':
                setattr(instance, field, validated_data.get(field, getattr(instance, field)))
        instance.save()
        return instance
