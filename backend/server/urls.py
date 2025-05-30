"""
URL configuration for your_django_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from django.views.generic import RedirectView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.routers import DefaultRouter
from apps.projects.views import ProjectViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token



swagger_permission_classes = [permissions.AllowAny] if settings.DEBUG else [permissions.IsAuthenticated]

schema_view = get_schema_view(
    openapi.Info(
        title="CoTeX API",
        default_version='v1',
        description="API documentation for CoTeX project",

    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

@ensure_csrf_cookie
def get_csrf(request):
    # this will set the `csrftoken` cookie on the response
    return JsonResponse({'detail': 'CSRF cookie set', 'csrf': get_token(request)})


urlpatterns = [

    path("api/csrf/", get_csrf),

    path('', RedirectView.as_view(url='/swagger/', permanent=False), name='swagger-redirect'),
    path('admin/', admin.site.urls),
    path("api/webhooks/", include("apps.webhooks.urls")),
    path("api/files/", include("apps.files.urls")),

    path("api/accounts/", include("apps.accounts.urls")),
    # projects API URLs
    path("api/projects/", include("apps.projects.urls")),

    # notes API URLs
    path("api/notes/", include("apps.notes.urls")),
    path("api/auth/", include("apps.authentication.urls")),
    
    # Swagger documentation URLs
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
