from rest_framework import generics
from ..models import ProbabilityCalc
from ..serializers import ProbabilityCalcSerializer

class ProbabilityCalcListCreateView(generics.ListCreateAPIView):
    queryset = ProbabilityCalc.objects.all()
    serializer_class = ProbabilityCalcSerializer

class ProbabilityCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProbabilityCalc.objects.all()
    serializer_class = ProbabilityCalcSerializer