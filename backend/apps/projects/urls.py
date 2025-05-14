from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

# Create a router and register our viewset
router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]