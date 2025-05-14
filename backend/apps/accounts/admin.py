from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Profile

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email', 'is_email_verified', 'theme_preference', 'get_projects')
    list_filter = ('is_email_verified', 'theme_preference')
    search_fields = ('user__username', 'user__email', 'bio')
    readonly_fields = ('get_projects_detail',)
    
    def email(self, obj):
        return obj.user.email
    
    def is_email_verified(self, obj):
        return obj.is_email_verified
    is_email_verified.boolean = True
    is_email_verified.short_description = "Email Verified"
    
    def get_projects(self, obj):
        """Returns a count of projects the user is associated with"""
        # This assumes you have a Project model with owner and collaborators fields
        from apps.projects.models import Project
        
        try:
            owned_count = Project.objects.filter(owner=obj.user).count()
            collab_count = Project.objects.filter(collaborators=obj.user).count()
            
            if owned_count > 0 or collab_count > 0:
                return format_html(
                    '<span style="color: green;">{} owned, {} collaborating</span>',
                    owned_count, collab_count
                )
            return "No projects"
        except:
            # Handle case where projects app might not be available
            return "N/A"
    get_projects.short_description = "Projects"
    
    def get_projects_detail(self, obj):
        """Returns detailed HTML list of projects the user is associated with"""
        # This assumes you have a Project model with owner and collaborators fields
        from apps.projects.models import Project
        
        try:
            owned_projects = Project.objects.filter(owner=obj.user)
            collab_projects = Project.objects.filter(collaborators=obj.user)
            
            html = "<h3>Owned Projects:</h3>"
            if owned_projects.exists():
                html += "<ul>"
                for project in owned_projects:
                    url = reverse('admin:projects_project_change', args=[project.id])
                    html += f'<li><a href="{url}">{project.name}</a></li>'
                html += "</ul>"
            else:
                html += "<p>No owned projects</p>"
                
            html += "<h3>Collaborating Projects:</h3>"
            if collab_projects.exists():
                html += "<ul>"
                for project in collab_projects:
                    url = reverse('admin:projects_project_change', args=[project.id])
                    html += f'<li><a href="{url}">{project.title}</a></li>'
                html += "</ul>"
            else:
                html += "<p>No collaborating projects</p>"
                
            return format_html(html)
        except Exception as e:
            # Handle case where projects app might not be available
            return f"Could not load projects: {str(e)}"
    get_projects_detail.short_description = "Project Details"
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'bio', 'profile_image')
        }),
        ('Preferences', {
            'fields': ('theme_preference',)
        }),
        ('Verification', {
            'fields': ('is_email_verified',)
        }),
        ('Projects', {
            'fields': ('get_projects_detail',)
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        # Prevent profile deletion (which would break user accounts)
        return False

admin.site.register(Profile, ProfileAdmin)

# Also register a nicer User admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_email_verified')
    list_filter = ('is_staff', 'is_superuser', 'profile__is_email_verified')
    
    def get_email_verified(self, obj):
        try:
            return obj.profile.is_email_verified
        except:
            return False
    get_email_verified.boolean = True
    get_email_verified.short_description = "Email Verified"

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)