from django.contrib import admin

# Register your models here.

from .models import FileEvent
@admin.register(FileEvent)
class FileEventAdmin(admin.ModelAdmin):
    list_display = ('file_path', 'file_name', 'event_type', 'project', 'processed', 'timestamp')
    list_filter = ('event_type', 'processed', 'timestamp')
    search_fields = ('file_path', 'file_name')
    ordering = ("-timestamp",)
    list_per_page = 20
    date_hierarchy = "timestamp"
    actions = ["export_as_csv"]
    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="file_events.csv"'
        writer = csv.writer(response)
        writer.writerow(["File", "Timestamp"])
        for event in queryset:
            writer.writerow([event.file_path, event.timestamp])
        return response
    export_as_csv.short_description = "Export selected file events as CSV"
    def has_add_permission(self, request):
        return False