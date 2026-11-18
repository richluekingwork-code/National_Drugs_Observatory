from typing import Any, cast

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg, Case, Count, FloatField, Q, Sum, Value, When
from django.db.models.functions import Coalesce, ExtractYear
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from core.permissions import IsInstitutionMember
from core.scoping import resolve_scope, scope_queryset
from core.views import BaseScopedViewSet, pick_institution_for

from .LDEA_serializer import (
    ArrestedPersonLookupSerializer,
    ArrestReadSerializer,
    ArrestWriteSerializer,
    CaseReadSerializer,
    CaseWriteSerializer,
    DrugRaidReadSerializer,
    DrugRaidWriteSerializer,
    DrugTypeReadSerializer,
    DrugTypeWriteSerializer,
    LogInVictimLookupSerializer,
    LogInVictimReadSerializer,
    LogInVictimWriteSerializer,
    SeizureReadSerializer,
    SeizureWriteSerializer,
)
from .models import (
    CaseParticipant,
    Cases,
    Create_Arrests,
    DrugRaid,
    DrugType,
    LogInVictims,
    Seizure,
)

User = get_user_model()


def _drf_request(view: Any) -> Request:
    """Narrow ``view.request`` to DRF's ``Request`` for type checkers."""
    return cast(Request, view.request)


def _county_only_q(user, *, county_field: str):
    """County Q filter with no institution restriction.

    Used by cross-institution autocomplete lookups, which intentionally
    let users search records from other institutions — but still must
    not expose records from counties outside their scope.

    Returns:
        - ``None``      → no filter (superuser, or fully unrestricted)
        - ``Q(pk__in=[])`` → deny (no memberships, or empty counties)
        - ``Q(county__iexact=...)`` → normal case
    """
    scope = resolve_scope(user)
    if scope.is_superuser:
        return None
    if not scope.institution_ids:
        return Q(pk__in=[])
    if set(scope.unrestricted_institution_ids) == set(scope.institution_ids):
        return None
    counties = [c for c in (scope.counties or []) if isinstance(c, str) and c.strip()]
    if not counties:
        return Q(pk__in=[])
    q = Q()
    for c in counties:
        q |= Q(**{f"{county_field}__iexact": c})
    return q


# ============================================================
# Drug type — global reference data (no county scope)
# ============================================================

class DrugTypeViewSet(viewsets.ModelViewSet):
    queryset = DrugType.objects.all()
    permission_classes = [IsAuthenticated, IsInstitutionMember]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "category"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return DrugTypeReadSerializer
        return DrugTypeWriteSerializer

    def perform_create(self, serializer: BaseSerializer) -> None:
        serializer.save(added_by=_drf_request(self).user)


# ============================================================
# Log-in victims — county-scoped on incident_county
# ============================================================

class CountyWriteGuard:
    """Rejects writes whose county is outside the user's assigned counties."""

    def _check_county(self, serializer, require=False):
        field = self.county_field
        if not field or "__" in field:
            return
        value = serializer.validated_data.get(field)
        if value is None and not require:
            return
        if not county_allowed(self.request.user, value):
            raise PermissionDenied(
                "You can only manage records in your assigned counties."
            )

    def perform_create(self, serializer):
        self._check_county(serializer, require=True)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_county(serializer)
        super().perform_update(serializer)

class LogInVictimViewSet(BaseScopedViewSet):
    model = LogInVictims
    date_field = "incident_date"

    scope_county_field = "incident_county"
    county_field = None  # custom _apply_filters handles ?county=

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "other_name",
        "phone_number",
        "email",
        "arrest_reference",
        "county_resident",
        "incident_county",
    ]
    ordering_fields = ["incident_date", "created_at", "last_name", "first_name"]
    ordering = ["-incident_date"]

    def get_queryset(self):
        return super().get_queryset().select_related("institution")

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return LogInVictimReadSerializer
        return LogInVictimWriteSerializer

    def _apply_filters(self, qs):
        qs = super()._apply_filters(qs)
        request = _drf_request(self)

        gender = request.query_params.get("gender")
        if gender:
            qs = qs.filter(gender=gender)

        incident_county = request.query_params.get("incident_county")
        if incident_county:
            qs = qs.filter(incident_county__iexact=incident_county)

        county_resident = request.query_params.get("county_resident")
        if county_resident:
            qs = qs.filter(county_resident__iexact=county_resident)

        # Legacy ?county= — matches either column
        county = request.query_params.get("county")
        if county:
            qs = qs.filter(
                Q(county_resident__iexact=county)
                | Q(incident_county__iexact=county)
            )

        return qs


# ============================================================
# Arrests — county-scoped on county_of_arrests
# ============================================================

class ArrestViewSet(BaseScopedViewSet):
    model = Create_Arrests
    date_field = "arrest_date"

    # `Create_Arrests` has both `county` and `county_of_arrests`.
    # Scope on `county_of_arrests` to match the dashboard aggregation
    # and the ?county= filter below.
    scope_county_field = "county_of_arrests"
    county_field = None  # custom _apply_filters handles ?county=

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        "arrests_number",
        "first_name",
        "middle_name",
        "last_name",
        "other_name",
        "arresting_officer",
        "badge_number",
        "charges",
    ]
    ordering_fields = ["arrest_date", "created_at", "last_name", "first_name"]
    ordering = ["-arrest_date"]

    def get_queryset(self):
        return super().get_queryset().select_related("institution")

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return ArrestReadSerializer
        return ArrestWriteSerializer

    def _apply_filters(self, qs):
        qs = super()._apply_filters(qs)
        request = _drf_request(self)
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        county = request.query_params.get("county")
        if county:
            qs = qs.filter(county_of_arrests__iexact=county)
        return qs


# ============================================================
# Seizures — county-scoped on county
# ============================================================

class SeizureViewSet(BaseScopedViewSet):
    model = Seizure
    date_field = "seizure_date"
    county_field = "county"
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["seized_by", "badge_number", "location_description", "drug_type"]
    ordering_fields = ["seizure_date", "created_at"]
    ordering = ["-seizure_date"]

    def get_queryset(self):
        return super().get_queryset().select_related("institution")

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return SeizureReadSerializer
        return SeizureWriteSerializer


# ============================================================
# Cases + participants — county-scoped on county
# ============================================================

class CasesViewSet(BaseScopedViewSet):
    model = Cases
    date_field = "filing_date"
    county_field = "county"
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["case_number", "title", "court_name", "charge"]
    ordering_fields = ["filing_date", "created_at"]
    ordering = ["-filing_date"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .prefetch_related("participants__person_arrested")
            .select_related("institution")
        )

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return CaseReadSerializer
        return CaseWriteSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = self._persist_case(serializer.validated_data)
        return Response(
            CaseReadSerializer(case).data,
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        case = self.get_object()
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(case, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        case = self._persist_case(serializer.validated_data, instance=case)
        return Response(CaseReadSerializer(case).data)

    def _persist_case(self, data, instance=None):
        # `None` (not `[]`) means "caller did not send participants" —
        # critical for PATCH so we don't wipe existing rows.
        participants = data.pop("participants", None)
        request = _drf_request(self)
        county = data.get("county")
        if (instance is None or county is not None) and not county_allowed(request.user, county):
            raise PermissionDenied("You can only manage records in your assigned counties.")

        if instance is None:
            institution = pick_institution_for(
                request.user,
                request.data.get("institution_id"),  # type: ignore[override]
            )
            instance = Cases.objects.create(
                **data,
                institution=institution,
            )
        else:
            for field, value in data.items():
                setattr(instance, field, value)
            instance.save()

        if participants is not None:
            CaseParticipant.objects.filter(case=instance).delete()
            CaseParticipant.objects.bulk_create([
                CaseParticipant(
                    case=instance,
                    person_arrested=p["person_arrested"],
                    role=p["role"],
                    is_primary=p.get("is_primary", False),
                )
                for p in participants
            ])

        return instance


# ============================================================
# Drug raids — county-scoped on county
# ============================================================

class DrugRaidViewSet(BaseScopedViewSet):
    model = DrugRaid
    date_field = "raid_date"
    county_field = "county"
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "location", "reference_code", "lead_officer"]
    ordering_fields = ["raid_date", "created_at"]
    ordering = ["-raid_date"]

    def get_queryset(self):
        return super().get_queryset().select_related("institution")

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action in ("list", "retrieve"):
            return DrugRaidReadSerializer
        return DrugRaidWriteSerializer


# ============================================================
# Dashboard / aggregate endpoints — county-scoped
# ============================================================

class DashboardViewSet(viewsets.ViewSet):
    """Read-only aggregations for the React frontend.

    Every model is scoped by institution + county, matching the user's
    InstitutionMembership. `DrugType` is excluded (global reference data).
    """

    permission_classes = [IsAuthenticated, IsInstitutionMember]

    def _scoped(self, model, county_field: str = "county"):
        from core.scoping import resolve_scope, scope_queryset

        scope = resolve_scope(self.request.user)
        qs = model.objects.all()
        print(f"DEBUG _scoped: model={model.__name__} county_field={county_field} "
              f"scope.is_empty={scope.is_empty} scope.counties={scope.counties}")
        result = scope_queryset(qs, scope, county_field=county_field)
        print(f"DEBUG _scoped: result type={type(result).__name__} is_none={result is None}")
        return result

    @action(detail=False, methods=["get"], url_path="hotspots")
    def hotspots(self, request: Request) -> Response:
        from collections import defaultdict
        counts = defaultdict(int)
        year = request.query_params.get("year")

        # 1. Victims (incident_county)
        qs_victims = self._scoped(LogInVictims, "incident_county")
        if year and year.isdigit():
            qs_victims = qs_victims.filter(incident_date__year=int(year))
        for v in qs_victims.values("incident_county").annotate(count=Count("id")):
            if v["incident_county"]:
                counts[v["incident_county"]] += v["count"]

        # 2. Arrests (county_of_arrests)
        qs_arrests = self._scoped(Create_Arrests, "county_of_arrests")
        if year and year.isdigit():
            qs_arrests = qs_arrests.filter(arrest_date__year=int(year))
        for a in qs_arrests.values("county_of_arrests").annotate(count=Count("id")):
            if a["county_of_arrests"]:
                counts[a["county_of_arrests"]] += a["count"]

        # 3. Cases (county)
        qs_cases = self._scoped(Cases)
        if year and year.isdigit():
            qs_cases = qs_cases.filter(filing_date__year=int(year))
        for c in qs_cases.values("county").annotate(count=Count("id")):
            if c["county"]:
                counts[c["county"]] += c["count"]

        # 4. Drug Raids (county)
        qs_raids = self._scoped(DrugRaid)
        if year and year.isdigit():
            qs_raids = qs_raids.filter(raid_date__year=int(year))
        for r in qs_raids.values("county").annotate(count=Count("id")):
            if r["county"]:
                counts[r["county"]] += r["count"]

        # 5. Seizures (county)
        qs_seizures = self._scoped(Seizure)
        if year and year.isdigit():
            qs_seizures = qs_seizures.filter(seizure_date__year=int(year))
        for s in qs_seizures.values("county").annotate(count=Count("id")):
            if s["county"]:
                counts[s["county"]] += s["count"]

        rows = [{"county": k, "total_cases": v} for k, v in counts.items()]
        rows.sort(key=lambda x: x["total_cases"], reverse=True)

        return Response(rows)

    @action(detail=False, methods=["get"], url_path="trafficked-drugs")
    def trafficked_drugs(self, request: Request) -> Response:
        qs = self._scoped(Seizure).exclude(drug_type="")
        year = request.query_params.get("year")
        if year and year.isdigit():
            qs = qs.filter(seizure_date__year=int(year))

        rows = (
            qs.values("drug_type")
            .annotate(
                total_cases=Count("id"),
                total_quantity=Coalesce(Sum("quantity"), 0.0),
            )
            .order_by("-total_quantity")
        )
        return Response(list(rows))

    @action(detail=False, methods=["get"], url_path="counts")
    def counts(self, request: Request) -> Response:
        return Response({
            "cases": self._scoped(Cases).count(),
            "drug_raids": self._scoped(DrugRaid).count(),
            "drug_types": DrugType.objects.count(),  # global lookup, not scoped
            "arrests": self._scoped(Create_Arrests, "county_of_arrests").count(),
            "seizures": self._scoped(Seizure).count(),
            "victims": self._scoped(LogInVictims, "incident_county").count(),
        })

    @action(detail=False, methods=["get"], url_path="effectiveness")
    def effectiveness(self, request: Request) -> Response:
        qs = self._scoped(Create_Arrests, "county_of_arrests").exclude(
            arrest_date__isnull=True
        )
        year = request.query_params.get("year")
        if year and year.isdigit():
            qs = qs.filter(arrest_date__year=int(year))

        scored = qs.annotate(
            _score=Case(
                When(status="transferred", then=Value(100.0)),
                When(status="detained", then=Value(50.0)),
                When(status="released", then=Value(0.0)),
                default=Value(0.0),
                output_field=FloatField(),
            )
        )

        rows = (
            scored.values("arrest_date")
            .annotate(score=Avg("_score"), count=Count("id"))
            .order_by("arrest_date")
        )

        return Response([
            {
                "date": r["arrest_date"].isoformat(),
                "score": round(r["score"] or 0.0, 1),
                "count": r["count"],
            }
            for r in rows
        ])

    @action(detail=False, methods=["get"], url_path="years")
    def years(self, request: Request) -> Response:
        arrest_years = set(
            self._scoped(Create_Arrests, "county_of_arrests")
            .annotate(y=ExtractYear("arrest_date"))
            .values_list("y", flat=True)
        )
        seizure_years = set(
            self._scoped(Seizure)
            .annotate(y=ExtractYear("seizure_date"))
            .values_list("y", flat=True)
        )
        from datetime import date
        all_years = sorted(
            {y for y in (arrest_years | seizure_years) if y},
            reverse=True,
        )
        if date.today().year not in all_years:
            all_years.insert(0, date.today().year)
        return Response(all_years)


# ============================================================
# Cross-institution autocomplete lookups — county-scoped only
# ============================================================
# These are intentionally cross-institution (per the picker UX), but a
# user must not search records from counties outside their scope.

class ArrestedPersonLookupView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ArrestedPersonLookupSerializer
    queryset = Create_Arrests.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "county_of_arrests"]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        q = _county_only_q(self.request.user, county_field="county_of_arrests")
        return qs.filter(q) if q is not None else qs


class ArrestedPersonLookupDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ArrestedPersonLookupSerializer
    queryset = Create_Arrests.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        q = _county_only_q(self.request.user, county_field="county_of_arrests")
        return qs.filter(q) if q is not None else qs


class LogInVictimLookupView(generics.ListAPIView):
    """Read-only search over logged-in victims for autocomplete widgets."""

    permission_classes = [IsAuthenticated]
    serializer_class = LogInVictimLookupSerializer
    queryset = LogInVictims.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "other_name",
        "phone_number",
        "person_id",
    ]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        q = _county_only_q(self.request.user, county_field="incident_county")
        return qs.filter(q) if q is not None else qs


class LogInVictimLookupDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogInVictimLookupSerializer
    queryset = LogInVictims.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        q = _county_only_q(self.request.user, county_field="incident_county")
        return qs.filter(q) if q is not None else qs