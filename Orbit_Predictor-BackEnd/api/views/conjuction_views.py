from rest_framework import generics
from ..models import Conjunction
from ..serializers import ConjunctionSerializer
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

class ConjunctionListCreateView(generics.ListCreateAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer

class ConjunctionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer

class ConjuctionFilterListView(generics.ListAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['sat1_object_designator', 'sat2_object_designator', 'date']
    search_fields = ['sat1_object_designator', 'sat2_object_designator']