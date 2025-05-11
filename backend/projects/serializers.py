from rest_framework import serializers
from .models import Project
from files.serializers import FileSerializer
from files.models import File


class ProjectSerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'files', 'created_at', 'updated_at']
        read_only_fields = ['owner']
