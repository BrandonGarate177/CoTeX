from django.contrib import admin
from .models import Note, NoteTag, NoteTagging

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_file_name', 'created_at', 'updated_at')
    search_fields = ('content',)
    list_filter = ('created_at', 'updated_at')
    
    def get_file_name(self, obj):
        """Get the file name associated with this note"""
        if obj.file:
            return obj.file.name
        elif obj.path:
            # Extract filename from path
            import os
            return os.path.basename(obj.path)
        return "No file"
    get_file_name.short_description = "File"

@admin.register(NoteTag)
class NoteTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(NoteTagging)
class NoteTaggingAdmin(admin.ModelAdmin):
    list_display = ('note', 'tag')