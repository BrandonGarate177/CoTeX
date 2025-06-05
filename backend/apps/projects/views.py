from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer, ProjectStructureSerializer
from apps.files.models import File
from apps.files.LaTeX import LatexCompiler
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        # Use lightweight serializer for list actions
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        # Check if this is a schema generation request from Swagger
        if getattr(self, 'swagger_fake_view', False):
            # Return empty queryset for schema generation
            return Project.objects.none()
            
        # Return only projects owned by the current user
        return Project.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def compile(self, request, pk=None):
        project = self.get_object()
        
        # Get main file
        try:
            main_file = File.objects.get(project=project, is_main=True)
        except File.DoesNotExist:
            return Response(
                {"error": "No main file marked for this project"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all other project files
        other_files = File.objects.filter(project=project, is_main=False)
        related_files = {file.name: file.content for file in other_files}
        
        # Compile LaTeX
        compiler = LatexCompiler()
        success, result = compiler.compile_latex(main_file.content, related_files)
        
        if success:
            # Return the PDF file
            response = HttpResponse(result, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{project.name}.pdf"'
            return response
        else:
            # Return the error
            return Response({"error": result}, status=status.HTTP_400_BAD_REQUEST)
        
    # change whether or not a project is a github repo
    # A github repo'd project can NOT be changed to a non-github repo'd project
    @action(detail=True, methods=['post'])
    def github(self, request, pk=None):
        project = self.get_object()
        project.is_github_repo = not project.is_github_repo
        project.save()
        return Response({"is_github_repo": project.is_github_repo})
    
    @action(detail=True, methods=['get'])
    def structure(self, request, pk=None):
        """Get project structure with files and folders but without file content"""
        project = self.get_object()
        serializer = ProjectStructureSerializer(project)
        return Response(serializer.data)