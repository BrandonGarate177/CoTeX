# webhooks/urls.py
from django.urls import path
from .views import github_webhook

urlpatterns = [
    path("github/", github_webhook, name="github_push"),
]
