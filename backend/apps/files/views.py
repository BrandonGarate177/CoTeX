from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import File, Folder, GitFile
from .serializers import FileSerializer, FolderSerializer, GitFileSerializer
from apps.projects.models import Project
from rest_framework.exceptions import ValidationError
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
        # Get project_id from request data
        project_id = self.request.data.get('project')
        folder_id = self.request.data.get('folder')
        
        # Case 1: Folder specified - use folder's project
        if folder_id:
            try:
                folder = Folder.objects.get(id=folder_id)
                # Verify user has access to this folder
                if folder.project.owner != self.request.user:
                    raise PermissionError("You don't have permission to add files to this folder")
                serializer.save(project=folder.project)
                return
            except Folder.DoesNotExist:
                raise ValidationError({"folder": "Specified folder does not exist"})
        
        # Case 2: Project specified directly
        elif project_id:
            try:
                project = Project.objects.get(id=project_id)
                # Verify user has access to this project
                if project.owner != self.request.user:
                    raise PermissionError("You don't have permission to add files to this project")
                serializer.save(project=project)
                return
            except Project.DoesNotExist:
                raise ValidationError({"project": "Specified project does not exist"})
        
        # Case 3: Neither project nor folder specified
        else:
            raise ValidationError({"error": "Either project or folder must be specified"})

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