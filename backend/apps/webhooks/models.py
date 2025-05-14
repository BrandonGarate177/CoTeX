from django.db import models
from apps.projects.models import Project

class FileEvent(models.Model):
    EVENT_TYPES = (
        ('created', 'File Created'),
        ('modified', 'File Modified'),
        ('deleted', 'File Deleted'),
    )
    
    file_path = models.CharField(max_length=512)  # Full path including filename
    file_name = models.CharField(max_length=255)  # Just the filename portion
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='file_events', null=True, blank=True)
    processed = models.BooleanField(default=False)  # Track if we've handled this event
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.event_type}: {self.file_path} ({self.timestamp})"