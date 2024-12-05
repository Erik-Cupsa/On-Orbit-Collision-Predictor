# api/authentication.py

import jwt
from rest_framework import authentication, exceptions
from django.conf import settings
from .models import User  # Ensure this points to your custom User model
import os

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)

        if not auth_header:
            return None  # No authentication credentials provided

        try:
            prefix, token = auth_header.decode('utf-8').split(' ')
            if prefix.lower() != 'bearer':
                return None  # Invalid prefix
        except ValueError:
            raise exceptions.AuthenticationFailed('Invalid token header. No credentials provided.')

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token.')

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found.')

        return (user, token)
