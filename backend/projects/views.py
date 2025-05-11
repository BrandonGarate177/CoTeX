from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Project
from .serializers import ProjectSerializer
from files.models import File
from files.LaTeX import LatexCompiler

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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