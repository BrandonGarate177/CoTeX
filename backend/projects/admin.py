from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'updated_at')