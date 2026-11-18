# core/views.py
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import InstitutionMembership
from core.constants import Roles
from core.mixins import CountyScopedMixin
from core.permissions import IsInstitutionMember


# ═══════════════════════════════════════════════════════════════
#  Helpers (kept for backwards compatibility — existing views import these)
# ═══════════════════════════════════════════════════════════════

def accessible_institution_ids(user):
    """Institution IDs where the user has an active membership.
    Returns None for superusers (sentinel: no filtering)."""
    if user.is_superuser:
        return None
    return InstitutionMembership.objects.filter(
        user=user,
        is_active=True,
        institution__is_active=True,
    ).values_list("institution_id", flat=True)

def _county_variants(name):
    words = [w for w in re.split(r"[\s_\-]+", name.strip()) if w]
    # "River Cess", "River_Cess", "RiverCess" (iexact handles case)
    return {" ".join(words), "_".join(words), "".join(words)}

def _county_key(name):
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())

def county_limit_for(user):
    """None = unrestricted, list = allowed counties, [] = no access."""
    if user.is_superuser:
        return None
    allowed, found = set(), False
    for m in InstitutionMembership.objects.filter(
        user=user, is_active=True, institution__is_active=True,
    ):
        found = True
        counties = [c.strip() for c in (m.counties or [])
                    if isinstance(c, str) and c.strip()]
        if not counties:
            return None  # any unrestricted membership = all counties
        allowed.update(counties)
    return list(allowed) if found else []


def limit_to_counties(qs, user, field="county"):
    allowed = county_limit_for(user)
    if allowed is None:
        return qs
    q = Q()
    for c in allowed:
        for v in _county_variants(c):
            q |= Q(**{f"{field}__iexact": v})
    return qs.filter(q) if q else qs.none()

def county_allowed(user, county):
    allowed = county_limit_for(user)
    if allowed is None:
        return True
    return bool(county) and _county_key(county) in {_county_key(c) for c in allowed}

def user_can_write(user):
    """True if the user holds any write-capable role."""
    if user.is_superuser:
        return True
    return Roles.CAN_WRITE.intersection(
        user.institution_memberships
        .filter(is_active=True, institution__is_active=True)
        .values_list("role", flat=True)
    )


def pick_institution_for(user, requested_id=None):
    """
    Determine which institution a new record belongs to.

    - If `requested_id` given, verifies active membership there.
    - Otherwise uses the user's first active membership.
    """
    qs = InstitutionMembership.objects.filter(
        user=user,
        is_active=True,
        institution__is_active=True,
    )
    if requested_id is not None:
        match = qs.filter(institution_id=requested_id).first()
        if match is None:
            raise PermissionDenied(
                "You are not a member of the requested institution."
            )
        return match.institution

    match = qs.select_related("institution").first()
    if match is None:
        raise PermissionDenied(
            "You do not belong to any active institution."
        )
    return match.institution


# ═══════════════════════════════════════════════════════════════
#  Base scoped viewset
# ═══════════════════════════════════════════════════════════════

class BaseScopedViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    """
    Institution- and county-scoped ModelViewSet for all NDO data.

    Scope enforcement (institution + county) lives in CountyScopedMixin,
    which delegates to core.scoping.scope_queryset. This class adds:

      - year / county / status query filters
      - safe create / update / soft-delete
      - bulk action

    Subclasses override:
      model            = SomeModel           (or queryset = ...)
      serializer_class = SomeSerializer
      date_field       = "seizure_date"      # enables ?year=
      county_field     = "county"            # enables ?county=
    """

    permission_classes = [IsAuthenticated, IsInstitutionMember]
    filter_backends = [SearchFilter, OrderingFilter]

    date_field = None
    county_field = "county"

    # ── Reads ─────────────────────────────────────────────────
    def get_queryset(self):
        # 1. CountyScopedMixin → institution + county whitelist
        qs = super().get_queryset()
        # 2. Extra query-param narrowing (year / county / status)
        return self._apply_filters(qs)

    def _apply_filters(self, qs):
        params = self.request.query_params

        year = params.get("year")
        if year and self.date_field:
            try:
                qs = qs.filter(**{f"{self.date_field}__year": int(year)})
            except ValueError:
                qs = qs.none()

        county = params.get("county")
        if county and self.county_field:
            # Extra narrowing WITHIN the user's scope — cannot escape it,
            # because scope_queryset() already applied the whitelist.
            qs = qs.filter(**{f"{self.county_field}__iexact": county})

        status_param = params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    # ── Writes ────────────────────────────────────────────────
    def perform_create(self, serializer):
        # Check both the body (JSON) and the URL (FormData)
        inst_id = (
            self.request.data.get("institution_id")
            or self.request.query_params.get("institution_id")
        )
        institution = pick_institution_for(self.request.user, inst_id)
        serializer.save(
            institution=institution,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        # Never hard-delete. Soft-delete preserves the audit trail.
        # NOTE: record_state is the field SoftDeleteManager filters on,
        # so we set BOTH status and record_state to keep them in sync.
        instance.status = instance.STATUS_DELETED
        instance.record_state = instance.STATUS_DELETED
        instance.updated_by = self.request.user
        instance.save(
            update_fields=["status", "record_state", "updated_by", "updated_at"]
        )

    # ── Bulk ──────────────────────────────────────────────────
    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        """
        POST /api/ldea/<resource>/bulk/
          {"action": "delete",     "ids": [1,2,3]}
          {"action": "set_status", "ids": [1,2,3], "status": "destroyed"}

        Scoping is inherited from get_queryset(), so IDs outside the user's
        institution + county scope are silently dropped (correct behavior
        for races where a row moved out of scope between list & action).
        """
        action_name = request.data.get("action")
        ids = request.data.get("ids") or []

        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "No records selected."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(pk__in=ids)

        if action_name == "delete":
            affected = qs.update(
                status=self.model.STATUS_DELETED,
                record_state=self.model.STATUS_DELETED,
                updated_by=request.user,
            )
            return Response({"affected": affected})

        if action_name == "set_status":
            new_status = request.data.get("status")
            field = self.model._meta.get_field("status")
            valid = {c[0] for c in field.choices}
            if new_status not in valid:
                return Response(
                    {"detail": f"Invalid status for {self.model.__name__}."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )
            affected = qs.update(
                status=new_status,
                updated_by=request.user,
            )
            return Response({"affected": affected})

        return Response(
            {"detail": "Unsupported bulk action."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )