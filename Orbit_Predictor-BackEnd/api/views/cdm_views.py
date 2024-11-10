from rest_framework import generics
from ..models import CDM
from ..serializers import CDMSerializer

class CDMSerializerListCreateView(generics.ListCreateAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer

class CDMCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer