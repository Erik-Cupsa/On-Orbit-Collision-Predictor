from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from ..models import CDM
from ..serializers import CDMSerializer

class CDMSerializerListCreateView(generics.ListCreateAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sat1_object_designator', 'sat2_object_designator']

class CDMCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer