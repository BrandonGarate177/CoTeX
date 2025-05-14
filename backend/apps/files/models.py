from django.db import models
from apps.projects.models import Project

class Folder(models.Model):
    name = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='folders')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subfolders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    content = models.TextField(blank=True, null=True)  # For text-based files
    file_upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)  # For binary or large files
    
    class Meta:
        # Ensure no duplicate folder names within the same parent folder or project root
        unique_together = [['name', 'parent', 'project']]
        # Add index for faster folder lookups
        indexes = [
            models.Index(fields=['project', 'parent']),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.parent}/{self.name}"
        return self.name

    @property
    def full_path(self):
        """Returns the full path of the folder from project root"""
        if self.parent:
            return f"{self.parent.full_path}/{self.name}"
        return self.name

class File(models.Model):
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='files', null=True, blank=True)
    is_main = models.BooleanField(default=False)  # Indicates if this is the main .tex file
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure no duplicate file names within the same folder
        unique_together = [['name', 'folder', 'project']]
        # Add constraint to ensure only one main file per project
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'is_main'],
                condition=models.Q(is_main=True),
                name='unique_main_file_per_project'
            )
        ]

    def __str__(self):
        if self.folder:
            return f"{self.folder}/{self.name}"
        return self.name

    @property
    def full_path(self):
        """Returns the full path of the file from project root"""
        if self.folder:
            return f"{self.folder.full_path}/{self.name}"
        return self.name
    

# Add this new model after your existing File and Folder models
class GitFile(models.Model):
    """Model representing a file from a Git repository"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='git_files')
    path = models.CharField(max_length=500)  # Full path in the repo (including filename)
    name = models.CharField(max_length=255)  # Just the filename portion
    content = models.TextField(blank=True)   # File content if retrieved
    last_commit_hash = models.CharField(max_length=40, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['project', 'path']  # Ensure unique paths within a project
        indexes = [
            models.Index(fields=['project', 'path']),  # For efficient lookups
        ]
    
    def __str__(self):
        return self.path
    
    @property
    def folder_path(self):
        """Returns just the directory portion of the path"""
        import os
        return os.path.dirname(self.path)