from rest_framework import serializers
from .models import Project
from apps.files.serializers import FileSerializer, FolderSerializer
from apps.files.models import File, Folder


class FileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for file listings (no content)"""

    class Meta:
        model = File
        fields = ['id', 'name', 'is_main', 'updated_at', 'folder']
        # Explicitly exclude content


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project listings"""
    file_count = serializers.SerializerMethodField()
    folder_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'created_at', 'updated_at', 'file_count', 'folder_count']

    def get_file_count(self, obj):
        return File.objects.filter(project=obj).count()

    def get_folder_count(self, obj):
        return Folder.objects.filter(project=obj).count()


class ProjectSerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)
    folders = FolderSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'files', 'folders', 'created_at', 'updated_at']
        read_only_fields = ['owner']


class FileStructureSerializer(serializers.ModelSerializer):
    """Serializer for file structure without content"""
    class Meta:
        model = File
        fields = ['id', 'name', 'is_main', 'created_at', 'updated_at', 'folder']


class FolderSerializer(serializers.ModelSerializer):
    files = FileStructureSerializer(many=True, read_only=True)
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'files', 'created_at', 'updated_at']


class ProjectStructureSerializer(serializers.ModelSerializer):
    """Serializer that includes project structure without file contents"""
    root_files = serializers.SerializerMethodField()
    folders = FolderSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'root_files', 'folders', 
                 'created_at', 'updated_at']
    
    def get_root_files(self, obj):
        # Only get files that are not in any folder
        files = File.objects.filter(project=obj, folder__isnull=True)
        return FileStructureSerializer(files, many=True).data
