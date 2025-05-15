from django.db import models
from django.conf import settings
from django.contrib.auth.models import User


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        User,  # Use this instead of directly importing User
        on_delete=models.CASCADE,
        related_name='projects'
    )

    collaborators = models.ManyToManyField(
        User,
        related_name='collaborated_projects',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # GitHub Metadata
    # IS this a github repo? 
    is_github_repo = models.BooleanField(default=False)
    github_repo = models.CharField(max_length=255, blank=True, null=True)  # e.g. 'username/repo-name'
    github_branch = models.CharField(max_length=255, default='main')


    def __str__(self):
        return self.name

