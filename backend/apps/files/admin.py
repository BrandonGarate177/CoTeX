from django.contrib import admin
from .models import File, Folder

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'folder', 'is_main', 'created_at', 'updated_at')
    list_filter = ('is_main', 'created_at', 'updated_at')
    search_fields = ('name', 'content')

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'parent', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('created_at', 'updated_at')