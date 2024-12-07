# api/authentication.py

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import User


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT Authentication class.
    """

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

        user_id = payload.get('user_id')
        role = payload.get('role')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found.')

        # Optionally, you can verify the role matches
        if user.role != role:
            raise exceptions.AuthenticationFailed('Invalid token payload.')

        return (user, token)
