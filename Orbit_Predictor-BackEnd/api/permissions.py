# api/permissions.py

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'admin')


class IsCollisionAnalyst(permissions.BasePermission):
    """
    Allows access only to collision analysts.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'collision_analyst')


class IsUser(permissions.BasePermission):
    """
    Allows access only to regular users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'user')


class CanViewCDM(permissions.BasePermission):
    """
    Custom permission to allow users to view CDMs based on their role and CDM privacy.
    - Admins and Collision Analysts can view all CDMs.
    - Regular Users can only view CDMs where privacy is True.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'collision_analyst']:
            return True
        elif request.user.role == 'user':
            return obj.privacy is True
        return False

    def has_permission(self, request, view):
        # Allow access only if the user is authenticated
        return bool(request.user and request.user.is_authenticated)
