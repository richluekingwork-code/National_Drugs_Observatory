from datetime import date
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import ExtractYear, TruncMonth
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework.pagination import PageNumberPagination

from accounts.models import InstitutionMembership
from core.views import BaseScopedViewSet, pick_institution_for, county_allowed
from core.scoping import resolve_scope, scope_queryset

from .models import (
    BeneficiaryHandover, BeneficiaryVerification, CaseClosure, ChildAdultAssessment,
    CommunityOutreachReport, FamilyTracingVerification, FollowUpVisit, TracingActionTaken,
    ChildTrackingRecord,
)
from .serializers import (
    AssessmentReadSerializer, AssessmentWriteSerializer,
    FollowUpReadSerializer, FollowUpWriteSerializer,
    TracingReadSerializer, TracingWriteSerializer,
    VerificationReadSerializer, VerificationWriteSerializer,
    HandoverReadSerializer, HandoverWriteSerializer,
    TracingActionReadSerializer, TracingActionWriteSerializer,
    OutreachReadSerializer, OutreachWriteSerializer,
    CaseClosureReadSerializer, CaseClosureWriteSerializer,
    LogInVictimFullSerializer,
    ChildTrackingReadSerializer, ChildTrackingWriteSerializer,
)


class MOGBaseViewSet(BaseScopedViewSet):
    def get_queryset(self):
        queryset = super().get_queryset().select_related("institution")
        if hasattr(self.model, "person"):
            queryset = queryset.select_related("person")
        return queryset
        
    def _apply_filters(self, qs):
        qs = super()._apply_filters(qs)
        person = self.request.query_params.get("person")
        if person:
            qs = qs.filter(person__person_id=person)
        return qs

    def _check_county(self, serializer, require=False):
        field = self.county_field
        if not field or "__" in field:
            return
        value = serializer.validated_data.get(field)
        if value is None and not require:
            return
        if not county_allowed(self.request.user, value):
            raise PermissionDenied("You can only manage records in your assigned counties.")

    def perform_create(self, serializer):
        self._check_county(serializer, require=True)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_county(serializer)
        super().perform_update(serializer)


class AssessmentViewSet(MOGBaseViewSet):
    model = ChildAdultAssessment
    date_field = "registration_date"
    county_field = "county"
    status_field = "risk_level"
    def get_serializer_class(self):
        return AssessmentReadSerializer if self.action in ("list", "retrieve") else AssessmentWriteSerializer


class FollowUpViewSet(MOGBaseViewSet):
    model = FollowUpVisit
    date_field = "visit_date"
    county_field = "county"
    def get_serializer_class(self):
        return FollowUpReadSerializer if self.action in ("list", "retrieve") else FollowUpWriteSerializer


class TracingViewSet(MOGBaseViewSet):
    model = FamilyTracingVerification
    date_field = "separation_date"
    county_field = "county"
    def get_serializer_class(self):
        return TracingReadSerializer if self.action in ("list", "retrieve") else TracingWriteSerializer


class VerificationViewSet(MOGBaseViewSet):
    model = BeneficiaryVerification
    date_field = "date_completed"
    county_field = "county"
    def get_serializer_class(self):
        return VerificationReadSerializer if self.action in ("list", "retrieve") else VerificationWriteSerializer


class HandoverViewSet(MOGBaseViewSet):
    model = BeneficiaryHandover
    date_field = "reunification_date"
    county_field = "county"
    def get_serializer_class(self):
        return HandoverReadSerializer if self.action in ("list", "retrieve") else HandoverWriteSerializer


class TracingActionViewSet(MOGBaseViewSet):
    model = TracingActionTaken
    date_field = "caseworker_date"
    scope_county_field = "person__incident_county"
    def get_serializer_class(self):
        return TracingActionReadSerializer if self.action in ("list", "retrieve") else TracingActionWriteSerializer


class OutreachViewSet(MOGBaseViewSet):
    model = CommunityOutreachReport
    date_field = "reporting_date"
    county_field = "follow_county"
    scope_county_field = "person__incident_county"
    def get_serializer_class(self):
        return OutreachReadSerializer if self.action in ("list", "retrieve") else OutreachWriteSerializer


class CaseClosureViewSet(MOGBaseViewSet):
    model = CaseClosure
    date_field = "date_case_closed"
    county_field = "county"
    def get_serializer_class(self):
        return CaseClosureReadSerializer if self.action in ("list", "retrieve") else CaseClosureWriteSerializer
    
    @transaction.atomic
    def perform_create(self, serializer):
        inst = pick_institution_for(self.request.user, self.request.data.get("institution_id"))
        self._check_county(serializer, require=True)
        serializer.save(institution=inst, created_by=self.request.user, updated_by=self.request.user)


class ChildTrackingViewSet(MOGBaseViewSet):
    model = ChildTrackingRecord
    date_field = "tracking_date"
    county_field = "county"

    def get_serializer_class(self):
        return ChildTrackingReadSerializer if self.action in ("list", "retrieve") else ChildTrackingWriteSerializer


class DashboardViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def _scope(self, qs, request, county_field="county", check_institution=True):
        """Helper to apply institution + county scope to any queryset."""
        scope = resolve_scope(request.user)
        return scope_queryset(qs, scope, county_field=county_field, check_institution=check_institution)

    @action(detail=False, methods=["get"], url_path="kpis")
    def kpis(self, request):
        y = request.query_params.get("year")
        def yf(qs, f):
            return qs.filter(**{f"{f}__year": int(y)}) if y and y.isdigit() else qs
        return Response({
            "assessments": yf(self._scope(ChildAdultAssessment.objects.all(), request), "registration_date").count(),
            "followups":   yf(self._scope(FollowUpVisit.objects.all(), request), "visit_date").count(),
            "closures":    yf(self._scope(CaseClosure.objects.all(), request), "date_case_closed").count(),
            "handovers":   yf(self._scope(BeneficiaryHandover.objects.all(), request), "reunification_date").count(),
        })

    @action(detail=False, methods=["get"], url_path="caseloads-by-county")
    def caseloads_by_county(self, request):
        y = request.query_params.get("year")
        qs = self._scope(ChildAdultAssessment.objects.all(), request)
        if y and y.isdigit():
            qs = qs.filter(registration_date__year=int(y))
        rows = qs.values("county").annotate(count=Count("id")).order_by("-count")
        return Response([{"county": r["county"] or "Unknown", "count": r["count"]} for r in rows])

    @action(detail=False, methods=["get"], url_path="reunification-rate")
    def reunification_rate(self, request):
        y = request.query_params.get("year")
        closures = self._scope(CaseClosure.objects.all(), request)
        if y and y.isdigit():
            closures = closures.filter(date_case_closed__year=int(y))
        ids = list(closures.values_list("person_id", flat=True))
        if not ids:
            return Response({"reunified": 0, "closed": 0, "rate": 0.0})
        h = self._scope(BeneficiaryHandover.objects.filter(person_id__in=ids), request)
        reunified = h.values("person_id").distinct().count()
        closed = closures.count()
        return Response({"reunified": reunified, "closed": closed, "rate": round((reunified / closed) * 100, 1) if closed else 0.0})

    @action(detail=False, methods=["get"], url_path="time-to-closure")
    def time_to_closure(self, request):
        y = request.query_params.get("year")
        closures = self._scope(CaseClosure.objects.all(), request)
        if y and y.isdigit():
            closures = closures.filter(date_case_closed__year=int(y))
        days = []
        for c in closures.only("date_case_closed", "person_id"):
            earliest = ChildAdultAssessment.objects.filter(person_id=c.person_id).order_by("registration_date").values_list("registration_date", flat=True).first()
            if not earliest or not c.date_case_closed:
                continue
            d = (c.date_case_closed - earliest).days
            if d >= 0:
                days.append(d)
        avg = round(sum(days) / len(days), 1) if days else 0.0
        return Response({"average_days": avg, "average_weeks": round(avg / 7, 1) if avg else 0.0, "sample_size": len(days)})

    @action(detail=False, methods=["get"], url_path="activity-trends")
    def activity_trends(self, request):
        y = request.query_params.get("year")
        def m(qs, f):
            if y and y.isdigit():
                qs = qs.filter(**{f"{f}__year": int(y)})
            return qs.annotate(month=TruncMonth(f)).values("month").annotate(count=Count("id")).order_by("month")
        series = {
            "assessments": m(self._scope(ChildAdultAssessment.objects.all(), request), "registration_date"),
            "followups":   m(self._scope(FollowUpVisit.objects.all(), request), "visit_date"),
            "tracings":    m(self._scope(FamilyTracingVerification.objects.all(), request), "separation_date"),
            "handovers":   m(self._scope(BeneficiaryHandover.objects.all(), request), "reunification_date"),
        }
        pts = {}
        for k, rows in series.items():
            for r in rows:
                if r["month"] is None:
                    continue
                lbl = r["month"].strftime("%Y-%m")
                pts.setdefault(lbl, {"month": lbl})
                pts[lbl][k] = r["count"]
        return Response(sorted(pts.values(), key=lambda p: p["month"]))

    @action(detail=False, methods=["get"], url_path="years")
    def years(self, request):
        def ys(qs, f):
            return set(qs.annotate(y=ExtractYear(f)).values_list("y", flat=True))
        years = (
            ys(self._scope(ChildAdultAssessment.objects.all(), request), "registration_date")
            | ys(self._scope(CaseClosure.objects.all(), request), "date_case_closed")
            | ys(self._scope(BeneficiaryHandover.objects.all(), request), "reunification_date")
        )
        years = sorted({y for y in years if y}, reverse=True)
        if date.today().year not in years:
            years.insert(0, date.today().year)
        return Response(years)

    @action(detail=False, methods=["get"], url_path=r"person/(?P<person_uuid>[^/.]+)")
    def person(self, request, person_uuid):
        from LDEA.models import LogInVictims
        # Cross-institution read: check_institution=False
        qs = self._scope(LogInVictims.objects.all(), request, county_field="incident_county", check_institution=False)
        p = qs.filter(person_id=person_uuid).first()
        if not p:
            return Response({"detail": "Person not found."}, status=404)
        return Response(LogInVictimFullSerializer(p, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path="persons")
    def persons(self, request):
        from LDEA.models import LogInVictims
        from LDEA.LDEA_serializer import LogInVictimMinimalSerializer
        # Cross-institution read: check_institution=False
        qs = self._scope(LogInVictims.objects.all(), request, county_field="incident_county", check_institution=False)
        
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(middle_name__icontains=q))
        qs = qs.order_by("last_name", "first_name")
        
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get("page_size", 50))
        page = paginator.paginate_queryset(qs, request)

        MOG_MODELS = (
            ChildAdultAssessment, FollowUpVisit, FamilyTracingVerification,
            BeneficiaryVerification, BeneficiaryHandover, TracingActionTaken,
            CommunityOutreachReport, CaseClosure,
        )
        ids = [p.id for p in page]
        counts = {pid: 0 for pid in ids}
        for model in MOG_MODELS:
            mq = model.objects.filter(person_id__in=ids)
            for row in mq.values("person_id").annotate(n=Count("id")):
                counts[row["person_id"]] += row["n"]

        data = []
        for p in page:
            item = dict(LogInVictimMinimalSerializer(p).data)
            item["age"] = p.age
            item["incident_date"] = p.incident_date
            item["mog_total"] = counts.get(p.id, 0)
            
            if p.photo:
                try:
                    item["photo"] = request.build_absolute_uri(p.photo.url)
                except ValueError:
                    item["photo"] = None
            else:
                item["photo"] = None
                
            data.append(item)

        return paginator.get_paginated_response(data)

    @action(detail=False, methods=["get"], url_path="people")
    def people(self, request):
        from LDEA.models import LogInVictims
        from LDEA.LDEA_serializer import LogInVictimMinimalSerializer
        # Cross-institution read: check_institution=False
        qs = self._scope(LogInVictims.objects.all(), request, county_field="incident_county", check_institution=False)
        
        models = (ChildAdultAssessment, FollowUpVisit, FamilyTracingVerification,
                  BeneficiaryVerification, BeneficiaryHandover, TracingActionTaken,
                  CommunityOutreachReport, CaseClosure)
        pids = set()
        for mod in models:
            mq = self._scope(mod.objects.all(), request)
            pids.update(mq.values_list("person_id", flat=True).distinct())
            
        if not pids:
            return Response([])
            
        qs = qs.filter(id__in=pids).order_by("last_name", "first_name")
        return Response(LogInVictimMinimalSerializer(qs, many=True).data)

    @action(detail=False, methods=["post"], url_path="persons/create")
    def create_person(self, request):
        """Create a new LDEA LogInVictims from within MOG."""
        from LDEA.models import LogInVictims
        from LDEA.LDEA_serializer import LogInVictimMinimalSerializer
        from datetime import datetime

        def need(k):
            v = (request.data.get(k) or "").strip()
            return (v, None) if v else (None, f"{k} is required")

        first_name, err = need("first_name")
        if err: return Response({"detail": err}, status=400)
        last_name, err = need("last_name")
        if err: return Response({"detail": err}, status=400)
        gender, err = need("gender")
        if err: return Response({"detail": err}, status=400)
        incident_date, err = need("incident_date")
        if err: return Response({"detail": err}, status=400)
        incident_location, err = need("incident_location")
        if err: return Response({"detail": err}, status=400)

        institution = pick_institution_for(request.user, request.data.get("institution_id"))
        if not institution:
            return Response({"detail": "Your account is not linked to an institution."}, status=400)

        try:
            incident_date_obj = datetime.strptime(incident_date, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "incident_date must be YYYY-MM-DD"}, status=400)

        county_resident = (request.data.get("county_resident") or "").strip()
        if not county_allowed(request.user, county_resident):
            return Response(
                {"detail": "You can only register beneficiaries in your assigned counties."},
                status=403,
            )
        v = LogInVictims.objects.create(
            first_name=first_name,
            last_name=last_name,
            middle_name=(request.data.get("middle_name") or "").strip(),
            other_name=(request.data.get("other_name") or "").strip(),
            gender=gender,
            date_of_birth=request.data.get("date_of_birth") or None,
            incident_date=incident_date_obj,
            incident_time=request.data.get("incident_time") or None,
            incident_location=incident_location,
            incident_county=(request.data.get("incident_county") or "").strip(),
            phone_number=(request.data.get("phone_number") or "").strip(),
            email=(request.data.get("email") or "").strip(),
            # county_resident=(request.data.get("county_resident") or "").strip(),
            county_resident=county_resident,
            district=(request.data.get("district") or "").strip(),
            address=(request.data.get("address") or "").strip(),
            nationality=(request.data.get("nationality") or "Liberian").strip(),
            institution=institution,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(LogInVictimMinimalSerializer(v).data, status=201)