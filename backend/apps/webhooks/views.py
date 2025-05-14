import json
import hmac
import hashlib
import os.path
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .models import FileEvent
from apps.projects.models import Project
from apps.files.models import File, Folder, GitFile

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def github_webhook(request):
    # Verify GitHub webhook signature (security)
    signature = request.headers.get('X-Hub-Signature-256', '')
    if not verify_signature(request.body, signature):
        return HttpResponse(status=status.HTTP_403_FORBIDDEN)
    
    data = json.loads(request.body)
    event_type = request.headers.get('X-GitHub-Event')
    
    # Handle different event types (push, pull_request, etc.)
    if event_type == 'push':
        # Get repository and branch info
        repo_name = data['repository']['full_name']  # e.g. "username/repo"
        branch = data['ref'].replace('refs/heads/', '')
        
        try:
            # Find the project associated with this repo
            project = Project.objects.get(github_repo=repo_name, github_branch=branch)
            
            # Process file changes
            for commit in data['commits']:
                # Handle added files
                for added_file in commit.get('added', []):
                    record_file_event(project, added_file, 'created')
                
                # Handle modified files
                for modified_file in commit.get('modified', []):
                    record_file_event(project, modified_file, 'modified')
                
                # Handle removed files
                for removed_file in commit.get('removed', []):
                    record_file_event(project, removed_file, 'deleted')
            
            # Process the recorded file events immediately
            process_file_events(project)
            
            return HttpResponse(status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return JsonResponse(
                {"error": f"No project found for repository {repo_name} and branch {branch}"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Default response for unsupported event types
    return HttpResponse(status=status.HTTP_202_ACCEPTED)

def verify_signature(payload_body, signature_header):
    """Verify that the webhook is from GitHub using the webhook secret."""
    if not signature_header:
        return False
    
    secret = settings.GITHUB_WEBHOOK_SECRET.encode()
    expected_signature = 'sha256=' + hmac.new(
        secret, payload_body, hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

def record_file_event(project, file_path, event_type):
    """Record a file event for later processing."""
    file_name = os.path.basename(file_path)
    
    FileEvent.objects.create(
        file_path=file_path,
        file_name=file_name,
        event_type=event_type,
        project=project,
        processed=False
    )

def process_file_events(project):
    """Process all unprocessed file events for a project."""
    unprocessed_events = FileEvent.objects.filter(
        project=project, 
        processed=False
    ).order_by('timestamp')
    
    for event in unprocessed_events:
        if event.event_type == 'created' or event.event_type == 'modified':
            # Create or update file record
            create_or_update_file(project, event.file_path, event.file_name)
        elif event.event_type == 'deleted':
            # Delete file record if it exists
            delete_file(project, event.file_path)
        
        # Mark as processed
        event.processed = True
        event.save()

# Update the create_or_update_file function to use GitFile
def create_or_update_file(project, file_path, file_name):
    """Create or update a file record in the database."""
    # Create or update GitFile record
    git_file, created = GitFile.objects.update_or_create(
        project=project,
        path=file_path,
        defaults={
            'name': file_name,
            # Optionally fetch content from GitHub here
            # 'content': fetch_file_content(project, file_path),
        }
    )
    
    # Also create/update the legacy File record for compatibility
    folder_path = os.path.dirname(file_path)
    folder = None
    if folder_path:
        folder_name = os.path.basename(folder_path)
        folder, _ = Folder.objects.get_or_create(
            project=project,
            name=folder_name,
            defaults={'parent': None}
        )
    
    file_obj, _ = File.objects.get_or_create(
        project=project,
        name=file_name,
        folder=folder
    )
    
    return git_file

def delete_file(project, file_path):
    """Delete a file record from the database."""
    file_name = os.path.basename(file_path)
    folder_path = os.path.dirname(file_path)
    
    folder = None
    if folder_path:
        folder_name = os.path.basename(folder_path)
        try:
            folder = Folder.objects.get(
                project=project,
                name=folder_name
            )
        except Folder.DoesNotExist:
            # If folder doesn't exist, we can't find the file
            return
    
    try:
        file_obj = File.objects.get(
            project=project,
            name=file_name,
            folder=folder
        )
        file_obj.delete()
    except File.DoesNotExist:
        # File doesn't exist, nothing to delete
        pass