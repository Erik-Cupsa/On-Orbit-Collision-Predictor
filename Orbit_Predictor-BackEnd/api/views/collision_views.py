from rest_framework import generics
from ..models import Collision
from ..serializers import CollisionSerializer

class CollisionListCreateView(generics.ListCreateAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer

class CollisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Collision.objects.all()
    serializer_class = CollisionSerializer