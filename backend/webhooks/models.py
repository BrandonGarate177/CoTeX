from django.db import models

class FileEvent(models.Model):
    file      = models.CharField(max_length=512)
    timestamp = models.DateTimeField(auto_now_add=True)