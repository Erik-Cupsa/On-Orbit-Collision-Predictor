from rest_framework import generics, viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from ..models import CDM
from ..serializers import CDMSerializer
from ..permissions import IsAdmin, CanViewCDM

class CDMSerializerListCreateView(generics.ListCreateAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sat1_object_designator', 'sat2_object_designator']

class CDMCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer

class CDMViewSet(viewsets.ModelViewSet):
    serializer_class = CDMSerializer
    

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]  # Only admins can create, update, or delete
        elif self.action in ['list', 'retrieve']:
            permission_classes = [CanViewCDM]  # Custom permission for viewing
        else:
            permission_classes = [permissions.IsAuthenticated]  # Default
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'collision_analyst']:
            return CDM.objects.all()
        elif user.role == 'user':
            return CDM.objects.filter(privacy=True)
        return CDM.objects.none()