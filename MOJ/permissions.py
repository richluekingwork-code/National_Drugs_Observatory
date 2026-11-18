from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import Roles

class MOJPermission(BasePermission):
    """
    Allows read access to any MOJ user.
    Restricts write access to MOJ Admin, Dept Head, and Data Officer roles.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        # Check if the user belongs to MOJ
        memberships = request.user.institution_memberships.filter(
            institution__code="MOJ", 
            is_active=True
        )
        if not memberships.exists():
            return False

        # Read-only access is allowed for all MOJ users (including Analysts/Viewers)
        if request.method in SAFE_METHODS:
            return True

        # Write access is restricted
        roles = memberships.values_list("role", flat=True)
        return bool(set(roles).intersection(Roles.CAN_WRITE))