from rest_framework import serializers
from .models import File, Folder, GitFile


class FileSerializer(serializers.ModelSerializer):
    folder = serializers.SerializerMethodField()

    def get_folder(self, obj): 
        if obj.folder: 
            return {
                'id': obj.folder.id,
                'name': obj.folder.name
            }
        return None

    class Meta:
        model = File
        fields = ['id', 'name', 'content', 'is_main', 'created_at', 'updated_at', 'folder']


class GitFileSerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GitFile
        fields = ['id', 'project', 'path', 'name', 'content', 
                  'last_commit_hash', 'last_updated', 'notes_count']
    
    def get_notes_count(self, obj):
        """Get count of notes associated with this file path"""
        from apps.notes.models import Note
        return Note.objects.filter(
            file__project=obj.project, 
            path=obj.path
        ).count()


class FileMinimalSerializer(serializers.ModelSerializer):
    """A minimal serializer that excludes file content"""
    class Meta:
        model = File
        fields = ['id', 'name', 'is_main', 'created_at', 'updated_at']


class FolderSerializer(serializers.ModelSerializer):
    files = FileMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'project', 'files', 'created_at', 'updated_at', 'file_count']