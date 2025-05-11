from django.contrib import admin
from .models import Note, NoteTag, NoteTagging

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'file', 'folder', 'project', 'created_at', 'updated_at')
    search_fields = ('title', 'content')
    list_filter = ('created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(NoteTag)
class NoteTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(NoteTagging)
class NoteTaggingAdmin(admin.ModelAdmin):
    list_display = ('note', 'tag')