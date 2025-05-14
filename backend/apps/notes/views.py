from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Note, NoteTag, NoteTagging
from .serializers import NoteSerializer, NoteTagSerializer, NoteTaggingSerializer
from apps.files.models import File, Folder
from apps.projects.models import Project

class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows notes to be viewed or edited.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-updated_at']  # Default ordering
    
    def get_queryset(self):
        # Check if this is a schema generation request from Swagger
        if getattr(self, 'swagger_fake_view', False):
            # Return empty queryset for schema generation
            return Note.objects.none()
            
        # Only return notes the user has access to based on project ownership
        return Note.objects.filter(
            Q(file__project__owner=self.request.user) |
            Q(folder__project__owner=self.request.user) |
            Q(project__owner=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        # Set the project owner automatically
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def for_file(self, request):
        """Get note for a specific file"""
        file_id = request.query_params.get('file_id')
        if not file_id:
            return Response(
                {"error": "file_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            file = File.objects.get(id=file_id, project__owner=request.user)
            note = Note.objects.filter(file=file).first()
            if note:
                serializer = self.get_serializer(note)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "No note exists for this file"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except File.DoesNotExist:
            return Response(
                {"error": "File not found or you don't have access"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def for_folder(self, request):
        """Get note for a specific folder"""
        folder_id = request.query_params.get('folder_id')
        if not folder_id:
            return Response(
                {"error": "folder_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            folder = Folder.objects.get(id=folder_id, project__owner=request.user)
            note = Note.objects.filter(folder=folder).first()
            if note:
                serializer = self.get_serializer(note)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "No note exists for this folder"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Folder.DoesNotExist:
            return Response(
                {"error": "Folder not found or you don't have access"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def for_project(self, request):
        """Get note for a specific project"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {"error": "project_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
            note = Note.objects.filter(project=project).first()
            if note:
                serializer = self.get_serializer(note)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "No note exists for this project"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found or you don't have access"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    # Add this to your existing NoteViewSet class

    @action(detail=False, methods=['post'])
    def create_for_file(self, request):
        """Create a note for a file if it doesn't exist yet"""
        file_id = request.data.get('file_id')
        if not file_id:
            return Response(
                {"error": "file_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the file and verify ownership
            file = File.objects.get(id=file_id, project__owner=request.user)
            
            # Check if note already exists
            existing_note = Note.objects.filter(file=file).first()
            if existing_note:
                return Response(
                    {"error": "Note already exists for this file", "note_id": existing_note.id},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the note with default content
            title = f"Notes on {file.name}"
            content = f"# {title}\n\nAdd your documentation for `{file.name}` here."
            
            note = Note.objects.create(
                file=file,
                title=title,
                content=content
            )
            
            serializer = self.get_serializer(note)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except File.DoesNotExist:
            return Response(
                {"error": "File not found or you don't have access"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class NoteTagViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows note tags to be viewed or edited.
    """
    queryset = NoteTag.objects.all()
    serializer_class = NoteTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']