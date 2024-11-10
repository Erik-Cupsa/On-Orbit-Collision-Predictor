from rest_framework import generics
from .models import Conjunction, Collision, ProbabilityCalc, CDM
from .serializers import ConjunctionSerializer, CollisionSerializer, ProbabilityCalcSerializer, CDMSerializer

# Conjunction Views
class ConjunctionListCreateView(generics.ListCreateAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer

class ConjunctionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conjunction.objects.all()
    serializer_class = ConjunctionSerializer

# Collision Views
class CollisionListCreateView(generics.ListCreateAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer

class CollisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer

# ProbabilityCalc Views
class ProbabilityCalcListCreateView(generics.ListCreateAPIView):
    queryset = ProbabilityCalc.objects.all()
    serializer_class = ProbabilityCalcSerializer

class ProbabilityCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProbabilityCalc.objects.all()
    serializer_class = ProbabilityCalcSerializer

# CDMSerializer Views
class CDMSerializerListCreateView(generics.ListCreateAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer

class CDMCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer
