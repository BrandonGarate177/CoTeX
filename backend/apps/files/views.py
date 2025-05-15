from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import File, Folder, GitFile
from .serializers import FileSerializer, FolderSerializer, GitFileSerializer
from apps.projects.models import Project

# Create your views here.

class GitFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for Git repository files.
    """
    serializer_class = GitFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return GitFile.objects.none()
            
        # Filter by project if requested
        project_id = self.request.query_params.get('project', None)
        if project_id:
            return GitFile.objects.filter(
                project_id=project_id,
                project__owner=self.request.user
            )
        
        # Otherwise return all files the user has access to
        return GitFile.objects.filter(project__owner=self.request.user)

class FileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing files.
    """
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return File.objects.none()
            
        # Filter by project or folder if requested
        project_id = self.request.query_params.get('project', None)
        folder_id = self.request.query_params.get('folder', None)
        
        queryset = File.objects.filter(project__owner=self.request.user)
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Set appropriate project based on folder if present
        folder_id = self.request.data.get('folder')
        if folder_id:
            try:
                folder = Folder.objects.get(id=folder_id)
                serializer.save(project=folder.project)
            except Folder.DoesNotExist:
                pass
        else:
            serializer.save()

class FolderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing folders.
    """
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Folder.objects.none()
            
        # Filter by project or parent folder
        project_id = self.request.query_params.get('project', None)
        parent_id = self.request.query_params.get('parent', None)
        
        queryset = Folder.objects.filter(project__owner=self.request.user)
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            # If no parent specified, get root folders
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        # If creating a subfolder, ensure it's in the same project as parent
        parent_id = self.request.data.get('parent')
        if parent_id:
            try:
                parent = Folder.objects.get(id=parent_id)
                serializer.save(project=parent.project)
            except Folder.DoesNotExist:
                pass
        else:
            serializer.save()
