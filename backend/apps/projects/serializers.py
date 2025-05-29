from rest_framework import serializers
from .models import Project
from apps.files.serializers import FileSerializer, FolderSerializer
from apps.files.models import File, Folder


class ProjectSerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)
    folders = FolderSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'files', 'folders', 'created_at', 'updated_at']
        read_only_fields = ['owner']
