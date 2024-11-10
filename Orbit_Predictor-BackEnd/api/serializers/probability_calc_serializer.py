from rest_framework import serializers
from ..models import ProbabilityCalc

class ProbabilityCalcSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProbabilityCalc
        fields = '__all__'