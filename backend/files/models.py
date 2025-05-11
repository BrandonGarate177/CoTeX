from django.db import models
from projects.models import Project

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
    # content = models.TextField(blank=True)
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