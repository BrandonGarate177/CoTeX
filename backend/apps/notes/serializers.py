from rest_framework import serializers
from .models import Note, NoteTag, NoteTagging
import markdown
import bleach
from bleach.sanitizer import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter


class NoteTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteTag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']


class NoteSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    parent_type = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    parent_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'slug', 'content',  
            'created_at', 'updated_at', 'file', 'folder', 'project',
            'tags', 'parent_type', 'parent_name', 'parent_id'
        ]
        read_only_fields = ['slug', 'parent_type', 'parent_name', 'parent_id']

    def get_tags(self, obj):
        tags = NoteTag.objects.filter(taggings__note=obj)
        return NoteTagSerializer(tags, many=True).data
    
    def get_parent_type(self, obj):
        if obj.file:
            return 'file'
        elif obj.folder:
            return 'folder'
        elif obj.project:
            return 'project'
        return None
    
    def get_parent_name(self, obj):
        if obj.file:
            return obj.file.name
        elif obj.folder:
            return obj.folder.name
        elif obj.project:
            return obj.project.name
        return None
    
    def get_parent_id(self, obj):
        if obj.file:
            return obj.file.id
        elif obj.folder:
            return obj.folder.id
        elif obj.project:
            return obj.project.id
        return None
    
    def validate(self, data):
        """
        Check that only one parent (file, folder, or project) is set
        """
        parents = [data.get('file'), data.get('folder'), data.get('project')]
        if parents.count(None) < 2:
            raise serializers.ValidationError(
                "A note must be associated with exactly one of: file, folder, or project"
            )
        if parents.count(None) == 3:
            raise serializers.ValidationError(
                "A note must be associated with a file, folder, or project"
            )
        return data

    def create(self, validated_data):
        note = Note.objects.create(**validated_data)
        note.save()
        return note
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class NoteTaggingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteTagging
        fields = ['id', 'note', 'tag']