from rest_framework import generics
from ..models import Conjunction
from ..serializers import ConjunctionSerializer

class ConjunctionListCreateView(generics.ListCreateAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer

class ConjunctionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer