# api/serializers.py

from rest_framework import serializers
from .models import User, CDM
import jwt
import datetime
from django.conf import settings


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    registration_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'registration_code', 'created_at']
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
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


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
        fields = ['id', 'satellite_1', 'satellite_2', 'conjunction_time', 'privacy']
        read_only_fields = ['id']

    def create(self, validated_data):
        return CDM.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.satellite_1 = validated_data.get('satellite_1', instance.satellite_1)
        instance.satellite_2 = validated_data.get('satellite_2', instance.satellite_2)
        instance.conjunction_time = validated_data.get('conjunction_time', instance.conjunction_time)
        instance.privacy = validated_data.get('privacy', instance.privacy)
        instance.save()
        return instance
