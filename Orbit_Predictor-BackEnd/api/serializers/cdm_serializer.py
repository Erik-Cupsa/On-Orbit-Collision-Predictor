from rest_framework import serializers
from ..models import CDM

class CDMSerializer(serializers.ModelSerializer):
    class Meta:
        model = CDM
        fields = '__all__'