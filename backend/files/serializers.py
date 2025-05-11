from rest_framework import serializers
from .models import File


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'name', 'content', 'is_main', 'created_at', 'updated_at']


