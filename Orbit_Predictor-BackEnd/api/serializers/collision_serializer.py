from rest_framework import serializers
from ..models import Collision

class CollisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collision
        fields = '__all__'