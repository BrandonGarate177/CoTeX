from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import GitFile
from .serializers import GitFileSerializer  

# Create your views here.

class GitFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for Git repository files.
    """
    serializer_class = GitFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return only files from projects the user can access
        return GitFile.objects.filter(project__owner=self.request.user)
    
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
