# organization_views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from ..models import Organization
from ..serializers import OrganizationSerializer, UserSerializer, CDMSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides the standard actions for the Organization model,
    plus custom endpoints to list users and CDMs.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter]
    search_fields = ['name']

    @action(detail=True, methods=['get'], url_path='users')
    def get_users(self, request, pk=None):
        """
        Returns all users belonging to this organization.
        """
        organization = self.get_object()  # Retrieve the Organization instance
        serializer = UserSerializer(organization.users.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='cdms')
    def get_cdms(self, request, pk=None):
        """
        Returns all CDMs associated with this organization.
        """
        organization = self.get_object()
        serializer = CDMSerializer(organization.cdms.all(), many=True)
        return Response(serializer.data)
