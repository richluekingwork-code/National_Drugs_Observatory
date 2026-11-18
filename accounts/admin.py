from django.contrib import admin
from .models import *


# Register your models here.
admin.site.register(Institution)
admin.site.register(CustomUser)
admin.site.register(UserProfile)
admin.site.register(InstitutionMembership)


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    # Columns to show in the list view
    list_display = ("timestamp", "user", "action", "ip_address", "device_info")
    
    # Sidebar filters
    list_filter = ("action", "timestamp")
    
    # Search bar (search by username or IP)
    search_fields = ("user__username", "user__email", "ip_address", "device_info")
    
    # Make the logs read-only so even a superuser can't accidentally edit history
    readonly_fields = ("user", "action", "ip_address", "device_info", "location", "timestamp")

    def has_add_permission(self, request):
        return False  # Prevent manual creation of logs

    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing of logs

    def has_delete_permission(self, request, obj=None):
        return False  # Prevent deleting of logs