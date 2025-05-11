from django.db import models
from django.conf import settings

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Use this instead of directly importing User
        on_delete=models.CASCADE,
        related_name='projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # GitHub Metadata
    github_repo = models.CharField(max_length=255, blank=True, null=True)  # e.g. 'username/repo-name'
    github_branch = models.CharField(max_length=255, default='main')

    def __str__(self):
        return self.name

