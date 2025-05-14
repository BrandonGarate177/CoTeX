# Update your existing urls.py file
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, FolderViewSet, GitFileViewSet

router = DefaultRouter()
router.register(r'files', FileViewSet)
router.register(r'folders', FolderViewSet)
router.register(r'git-files', GitFileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]