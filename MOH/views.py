"""DRF viewsets for the MOH app."""
from datetime import date
from typing import cast

from django.core.exceptions import ValidationError
from django.db.models import Q, Sum, Count, QuerySet
from django.db.models.functions import TruncMonth, ExtractYear
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from accounts.models import Institution
from core.views import (BaseScopedViewSet, accessible_institution_ids,
                        limit_to_counties, county_allowed, pick_institution_for)
from . import services

from .models import DemandReduction, Prevention, TreatmentFacility
from .serializers import (
    DemandReductionReadSerializer, DemandReductionWriteSerializer,
    PreventionReadSerializer, PreventionWriteSerializer,
    TreatmentFacilityReadSerializer, TreatmentFacilityWriteSerializer, 
    IncomingReferralSerializer, MOHVictimListSerializer,
)

from LDEA.models import LogInVictims
from LDEA.LDEA_serializer import LogInVictimReadSerializer, LogInVictimWriteSerializer
from rest_framework import filters, mixins, viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from rest_framework import filters, mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from core.mixins import CountyScopedMixin
from core.scoping import resolve_scope, scope_queryset

class MOHVictimViewSet(
    mixins.ListModelMixin, 
    mixins.RetrieveModelMixin, 
    mixins.CreateModelMixin, 
    viewsets.GenericViewSet
):
    """
    Directory of LDEA Victims for MOH staff to view and add.
    """
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "first_name", "middle_name", "last_name", "other_name", 
        "person_id", "phone_number"
    ]
    ordering_fields = ["incident_date", "created_at", "last_name", "first_name"]
    ordering = ["-incident_date"]

    def get_queryset(self) -> QuerySet[LogInVictims]:
        request = cast(Request, self.request)
        
        # 1. Enforce the Institution + County Scope FIRST
        scope = resolve_scope(request.user)
        qs = scope_queryset(LogInVictims.objects.all(), scope, county_field="incident_county")
        
        # 2. Apply your existing custom filters on top of the scoped data
        qs = qs.select_related("institution")
        
        year = request.query_params.get("year")
        if year and str(year).isdigit():
            qs = qs.filter(incident_date__year=int(year))
            
        county = request.query_params.get("county_resident")
        if county:
            qs = qs.filter(county_resident__iexact=county)
            
        gender = request.query_params.get("gender")
        if gender:
            qs = qs.filter(gender=gender)
            
        return qs
    
    def get_serializer_class(self):
        if self.action == "list":
            return MOHVictimListSerializer
        elif self.action == "create":
            return LogInVictimWriteSerializer
        return LogInVictimReadSerializer

    def perform_create(self, serializer):
        user = self.request.user

        # Block records outside the user's assigned counties
        # (a missing county is also rejected for restricted users)
        county = serializer.validated_data.get("county_resident")
        if not county_allowed(user, county):
            raise PermissionDenied(
                "You can only register beneficiaries in your assigned counties."
            )

        requested = (
                self.request.data.get("institution_id")
                or self.request.query_params.get("institution_id")
        )

        if user.is_superuser:
            # accessible_institution_ids() returns None for superusers,
            # which is what crashed list(...) before.
            institution = (
                Institution.objects.filter(pk=requested).first()
                if requested
                else Institution.objects.filter(code="MOH").first()
            )
            if institution is None:
                raise ValidationError("No institution found to attach this record to.")
        else:
            # Verifies the user is an active member of the requested institution
            institution = pick_institution_for(user, requested)

        serializer.save(institution=institution, created_by=user)

class DemandReductionViewSet(BaseScopedViewSet):
    """
    Demand reduction records, visible to:
      - the referring institution (as creator), and
      - the receiving facility's institution once the referral is
        accepted or beyond.
    """

    model = DemandReduction
    date_field = "created_at"
    county_field = "county"
    status_field = "admission_status"

    def get_queryset(self) -> QuerySet[DemandReduction]:
        request = cast(Request, self.request)
        from core.scoping import resolve_scope, scope_queryset
        
        # Get the user's resolved scope (Institutions + Counties)
        scope = resolve_scope(request.user)
        
        if request.user.is_superuser:
            qs = DemandReduction.objects.all()
        else:
            inst_ids = scope.institution_ids
            qs = DemandReduction.objects.filter(
                Q(institution_id__in=inst_ids)
                | Q(
                    receiving_facility__institution_id__in=inst_ids,
                    referral_status__in=[
                        "accepted", "in_transit", "completed",
                    ],
                )
            ).distinct()

        # Apply the County Scope using the new Mixin logic
        qs = scope_queryset(qs, scope, county_field="county")

        qs = qs.select_related("institution", "receiving_facility")
        qs = qs.prefetch_related("persons")
        
        # Remove the old self._apply_county_scope(qs) line!
        return qs
    
    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return DemandReductionReadSerializer
        return DemandReductionWriteSerializer

    # ---------- referral actions ----------

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        self._check_facility_scope(request, pk)
        try:
            referral = services.accept_referral(
                actor=request.user, referral_id=pk,
            )
        except ValidationError as exc:
            raise ValidationError(exc.message_dict
                                  if hasattr(exc, "message_dict")
                                  else exc.messages)
        except PermissionDenied as exc:
            raise PermissionDenied(str(exc))
        return Response(
            DemandReductionReadSerializer(
                referral, context={"request": request},
            ).data,
        )

    @action(detail=True, methods=["post"], url_path="decline")
    def decline(self, request, pk=None):
        reason = (request.data or {}).get("reason", "")
        self._check_facility_scope(request, pk)
        try:
            referral = services.decline_referral(
                actor=request.user, referral_id=pk, reason=reason,
            )
        except ValidationError as exc:
            raise ValidationError(exc.message_dict
                                  if hasattr(exc, "message_dict")
                                  else exc.messages)
        except PermissionDenied as exc:
            raise PermissionDenied(str(exc))
        return Response(
            DemandReductionReadSerializer(
                referral, context={"request": request},
            ).data,
        )

    @action(detail=False, methods=["get"], url_path="incoming-referrals")
    def incoming_referrals(self, request):
        """
        Pending referrals arriving at facilities owned by any of the
        caller's institutions. Redacted serializer — no clinical data
        until accepted.
        """
        if request.user.is_superuser:
            qs = DemandReduction.objects.filter(
                referral_status=DemandReduction.REFERRAL_STATUS_PENDING,
                receiving_facility__isnull=False,
            )
        else:
            inst_ids = list(accessible_institution_ids(request.user))
            qs = DemandReduction.objects.filter(
                receiving_facility__institution_id__in=inst_ids,
                referral_status=DemandReduction.REFERRAL_STATUS_PENDING,
            )

        # qs = (
        #     qs
        #     .select_related("institution", "receiving_facility")
        #     .prefetch_related("persons")
        #     .order_by("-referred_at")
        # )
        qs = limit_to_counties(qs, request.user, "receiving_facility__county")

        page = self.paginate_queryset(qs)
        serializer = IncomingReferralSerializer(
            page if page is not None else qs,
            many=True,
            context={"request": request},
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def _check_facility_scope(self, request, referral_id):
        ref = (
            DemandReduction.objects
            .select_related("receiving_facility")
            .filter(pk=referral_id)
            .first()
        )
        facility = ref.receiving_facility if ref else None
        if facility and not county_allowed(request.user, facility.county):
            raise PermissionDenied(
                "This referral is for a facility outside your assigned counties."
            )

    def _check_county(self, serializer):
        county = serializer.validated_data.get("county")
        if county is not None and not county_allowed(self.request.user, county):
            raise PermissionDenied(
                "You can only manage records in your assigned counties."
            )

    def perform_create(self, serializer):
        if not county_allowed(self.request.user, serializer.validated_data.get("county")):
            raise PermissionDenied(
                "You can only manage records in your assigned counties."
            )
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_county(serializer)
        super().perform_update(serializer)


class PreventionViewSet(BaseScopedViewSet):
    model = Prevention
    date_field = "date"
    county_field = "county"

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return PreventionReadSerializer
        return PreventionWriteSerializer


class TreatmentFacilityViewSet(BaseScopedViewSet):
    model = TreatmentFacility
    county_field = "county"
    status_field = "operational_status"

    def get_queryset(self) -> QuerySet[TreatmentFacility]:  # type: ignore[override]
        # BYPASS SCOPING: Allow anyone to see the facilities for the dropdown
        return TreatmentFacility.objects.all()

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return TreatmentFacilityReadSerializer
        return TreatmentFacilityWriteSerializer


class MOHDashboardViewSet(ViewSet):
    """Read-only aggregations for MOH analytics."""

    permission_classes = [IsAuthenticated]

    def _scoped(self, model_qs, request):
        if request.user.is_superuser:
            return model_qs
        ids = accessible_institution_ids(request.user)
        qs = model_qs.filter(institution_id__in=ids)
        return limit_to_counties(qs, request.user, "county")

    def _year(self, request):
        y = request.query_params.get("year")
        return int(y) if y and y.isdigit() else None

    @action(detail=False, methods=["get"], url_path="kpis")
    def kpis(self, request):
        year = self._year(request)

        admissions = self._scoped(DemandReduction.objects.all(), request)
        if year:
            admissions = admissions.filter(created_at__year=year)

        facilities = self._scoped(
            TreatmentFacility.objects.all(), request,
        )
        active_facilities = facilities.filter(operational_status="active")

        bed_totals = facilities.aggregate(
            total=Sum("total_beds"),
            occupied=Sum("current_occupancy"),
        )
        total_beds = bed_totals["total"] or 0
        occupied = bed_totals["occupied"] or 0

        prevention = self._scoped(Prevention.objects.all(), request)
        if year:
            prevention = prevention.filter(date__year=year)

        return Response({
            "admissions": admissions.count(),
            "active_facilities": active_facilities.count(),
            "total_beds": total_beds,
            "occupied_beds": occupied,
            "occupancy_rate": (
                round((occupied / total_beds) * 100, 1)
                if total_beds else 0.0
            ),
            "prevention_reports": prevention.count(),
        })

    @action(detail=False, methods=["get"], url_path="admissions-by-county")
    def admissions_by_county(self, request):
        year = self._year(request)
        qs = self._scoped(DemandReduction.objects.all(), request)
        if year:
            qs = qs.filter(created_at__year=year)

        rows = (
            qs.values("county")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response([
            {"county": r["county"] or "Unknown", "count": r["count"]}
            for r in rows
        ])

    @action(detail=False, methods=["get"], url_path="admissions-trend")
    def admissions_trend(self, request):
        year = self._year(request)
        qs = self._scoped(DemandReduction.objects.all(), request)
        if year:
            qs = qs.filter(created_at__year=year)

        rows = (
            qs
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        return Response([
            {
                "month": r["month"].strftime("%Y-%m") if r["month"] else None,
                "count": r["count"],
            }
            for r in rows if r["month"]
        ])

    @action(detail=False, methods=["get"], url_path="bed-utilization")
    def bed_utilization(self, request):
        facilities = self._scoped(
            TreatmentFacility.objects
            .filter(operational_status="active", total_beds__gt=0),
            request,
        ).order_by("-current_occupancy")

        rows = []
        for f in facilities[:20]:
            occupancy_rate = (
                round((f.current_occupancy / f.total_beds) * 100, 1)
                if f.total_beds else 0.0
            )
            rows.append({
                "id": f.pk,
                "facility_name": f.facility_name,
                "county": f.county,
                "total_beds": f.total_beds,
                "current_occupancy": f.current_occupancy,
                "occupancy_rate": occupancy_rate,
            })
        return Response(rows)

    @action(detail=False, methods=["get"], url_path="prevention-reach")
    def prevention_reach(self, request):
        year = self._year(request)
        qs = self._scoped(Prevention.objects.all(), request)
        if year:
            qs = qs.filter(date__year=year)

        agg = qs.aggregate(
            sud=Count("id", filter=Q(sud_awareness=True)),
            school=Count("id", filter=Q(school_health_club=True)),
            media=Count("id", filter=Q(media_campaign=True)),
            harm=Count("id", filter=Q(harm_reduction=True)),
            radio=Count("id", filter=Q(radio_talk_show=True)),
        )
        return Response([
            {"activity": "SUD awareness", "count": agg["sud"]},
            {"activity": "School health clubs", "count": agg["school"]},
            {"activity": "Media campaign", "count": agg["media"]},
            {"activity": "Harm reduction", "count": agg["harm"]},
            {"activity": "Radio talk show", "count": agg["radio"]},
        ])

    @action(detail=False, methods=["get"], url_path="years")
    def years(self, request):
        def _years(qs, field):
            return set(
                qs.annotate(y=ExtractYear(field)).values_list("y", flat=True)
            )

        years = (
            _years(DemandReduction.objects.all(), "created_at")
            | _years(Prevention.objects.all(), "date")
        )
        years = sorted({y for y in years if y}, reverse=True)
        if date.today().year not in years:
            years.insert(0, date.today().year)
        return Response(years)