# webhooks/urls.py
from django.urls import path
from .views import github_push_hook

urlpatterns = [
    path("github/", github_push_hook, name="github_push"),
]
