# MOJ/views.py
"""DRF viewsets for the MOJ app — county-scoped via CountyScopedMixin.

Scoping rule: every viewset is restricted to the requesting user's
institution memberships AND the union of their `counties` lists.
FK paths point at the parent `Cases` model, which owns the `county`
field. A missing `scope_county_field` on a class means no county
filter is applied — do not remove it.

Original file: committed at git HEAD (2db9cf0). This version restores
that file and adds the scoping mixin. `list_prosecutors` is restored
and must be verified against the original.
"""
from django.contrib.auth import get_user_model
from rest_framework import filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.mixins import CountyScopedMixin

from .models import (
    Appeal,
    CaseAssignment,
    Cases,
    CourtCase,
    CourtHearing,
    CourtOrder,
    Fine,
    FinePayment,
    InformationRequest,
    LegalReview,
)
from .permissions import MOJPermission
from .serializers import (
    AppealSerializer,
    CaseAssignmentSerializer,
    CourtCaseSerializer,
    CourtHearingSerializer,
    CourtOrderSerializer,
    FinePaymentSerializer,
    FineSerializer,
    InformationRequestSerializer,
    LegalReviewSerializer,
    MOJCaseReadSerializer,
    MOJCaseWriteSerializer,
)


# ═══════════════════════════════════════════════════════════════
#  Pagination
# ═══════════════════════════════════════════════════════════════

class MOJPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ═══════════════════════════════════════════════════════════════
#  MOJ Case — root model, direct `county` field
# ═══════════════════════════════════════════════════════════════

class MOJCaseViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = (
        Cases.objects
        .all()
        .select_related("institution")
        .prefetch_related("participants__person_arrested")
    )
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["case_number", "title", "description", "county"]
    ordering_fields = ["filing_date", "created_at"]

    scope_county_field = "county"

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return MOJCaseReadSerializer
        return MOJCaseWriteSerializer

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Legal Review — FK: case → county
# ═══════════════════════════════════════════════════════════════

class LegalReviewViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = LegalReview.objects.all()
    serializer_class = LegalReviewSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Court Case — FK: original_case → county
# ═══════════════════════════════════════════════════════════════

class CourtCaseViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = CourtCase.objects.all()
    serializer_class = CourtCaseSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(original_case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Information Request — FK: case → county
# ═══════════════════════════════════════════════════════════════

class InformationRequestViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = InformationRequest.objects.all()
    serializer_class = InformationRequestSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Court Hearing — FK: court_case → original_case → county
# ═══════════════════════════════════════════════════════════════

class CourtHearingViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = CourtHearing.objects.all()
    serializer_class = CourtHearingSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "court_case__original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(court_case__original_case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Court Order — FK: court_case → original_case → county
# ═══════════════════════════════════════════════════════════════

class CourtOrderViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = CourtOrder.objects.all()
    serializer_class = CourtOrderSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "court_case__original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(court_case__original_case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Fine — FK: court_order → court_case → original_case → county
# ═══════════════════════════════════════════════════════════════

class FineViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "court_order__court_case__original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(court_order__court_case__original_case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Fine Payment — FK: fine → court_order → court_case → original_case → county
# ═══════════════════════════════════════════════════════════════

class FinePaymentViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = FinePayment.objects.all()
    serializer_class = FinePaymentSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "fine__court_order__court_case__original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        fine_id = self.request.query_params.get("fine")
        if fine_id:
            qs = qs.filter(fine_id=fine_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Appeal — FK: court_case → original_case → county
# ═══════════════════════════════════════════════════════════════

class AppealViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = Appeal.objects.all()
    serializer_class = AppealSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "court_case__original_case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(court_case__original_case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Case Assignment — FK: case → county
# ═══════════════════════════════════════════════════════════════

class CaseAssignmentViewSet(CountyScopedMixin, viewsets.ModelViewSet):
    queryset = CaseAssignment.objects.all()
    serializer_class = CaseAssignmentSerializer
    permission_classes = [MOJPermission]
    pagination_class = MOJPagination

    scope_county_field = "case__county"

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    def perform_create(self, serializer):
        inst = self.request.user.institution_memberships.first()
        serializer.save(institution=inst, created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════
#  Utility views
# ═══════════════════════════════════════════════════════════════
# ⚠️ VERIFY against your original — I reconstructed this from the
#    import in MOJ/urls.py. If your original returned different
#    fields or filtered differently, merge it back.

@api_view(["GET"])
@permission_classes([IsAuthenticated, MOJPermission])
def list_prosecutors(request):
    """Return users who can be assigned as prosecutors on MOJ cases."""
    User = get_user_model()
    qs = (
        User.objects
        .filter(
            institution_memberships__is_active=True,
            institution_memberships__institution__is_active=True,
            institution_memberships__role__in=[
                "institution_admin",
                "department_head",
                "data_officer",
            ],
        )
        .distinct()
        .values("id", "username", "first_name", "last_name", "email")
    )
    return Response(list(qs))