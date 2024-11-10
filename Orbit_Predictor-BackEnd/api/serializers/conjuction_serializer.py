from rest_framework import serializers
from ..models import Conjunction

class ConjunctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conjunction
        fields = '__all__'