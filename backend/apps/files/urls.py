from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, FolderViewSet, GitFileViewSet

router = DefaultRouter()
router.register(r'files', FileViewSet, basename='file')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'git-files', GitFileViewSet, basename='git-file')

urlpatterns = [
    path('', include(router.urls)),
]