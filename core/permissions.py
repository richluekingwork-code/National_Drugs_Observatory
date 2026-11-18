"""DRF permission classes for the LDEA app.

These are the coarse, HTTP-boundary gates. Object-level and
field-level rules live in the serializers and services.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

from core.constants import Roles


def _active_institution_ids(user):
    """Institutions where the user has an active membership."""
    if not user.is_authenticated:
        return []
    return (
        user.institution_memberships
        .filter(
            is_active=True,
            institution__is_active=True,
        )
        .values_list("institution_id", flat=True)
    )


def _user_roles(user):
    if not user.is_authenticated:
        return set()
    return set(
        user.institution_memberships
        .filter(is_active=True, institution__is_active=True)
        .values_list("role", flat=True)
    )


class IsInstitutionMember(BasePermission):
    """Read allowed for any active membership; writes for CAN_WRITE."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return bool(_active_institution_ids(request.user))

        roles = _user_roles(request.user)
        return bool(roles & Roles.CAN_WRITE)


class IsInstitutionAdmin(BasePermission):
    """Restricted to institution administrators."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return Roles.ADMIN in _user_roles(request.user)