from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, NoteTagViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'', NoteViewSet, basename='note')
router.register(r'tags', NoteTagViewSet, basename='note-tag')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]