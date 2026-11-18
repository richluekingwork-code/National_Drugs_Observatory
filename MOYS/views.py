from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework.pagination import PageNumberPagination

from core.views import BaseScopedViewSet
from core.scoping import resolve_scope, scope_queryset
from LDEA.models import LogInVictims

from .models import (
    MYSReferral, ReceiptDisposition, MYSPreTreatmentReintegration,
    ARYEPRegistration, IndividualYouthReintegrationPlan, TVETSkillsTraining,
    MYSYouthIntervention, MYSEmploymentApprenticeshipBusiness,
    MYSFamilyCommunityReintegration, MYSReintegrationFollowUp,
    MYSCaseClosure, MYSServiceProvider
)
from .serializers import (
    MYSReferralReadSerializer, MYSReferralWriteSerializer,
    ReceiptDispositionReadSerializer, ReceiptDispositionWriteSerializer,
    PreTreatmentReintegrationReadSerializer, PreTreatmentReintegrationWriteSerializer,
    ARYEPRegistrationReadSerializer, ARYEPRegistrationWriteSerializer,
    ReintegrationPlanReadSerializer, ReintegrationPlanWriteSerializer,
    TVETReadSerializer, TVETWriteSerializer,
    YouthInterventionReadSerializer, YouthInterventionWriteSerializer,
    EmploymentBusinessReadSerializer, EmploymentBusinessWriteSerializer,
    FamilyReintegrationReadSerializer, FamilyReintegrationWriteSerializer,
    FollowUpReadSerializer, FollowUpWriteSerializer,
    CaseClosureReadSerializer, CaseClosureWriteSerializer,
    ServiceProviderReadSerializer, ServiceProviderWriteSerializer,
    MOYSLogInVictimSerializer
)


class MOYSBaseViewSet(BaseScopedViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        person_uuid = self.request.query_params.get("person")
        
        if person_uuid:
            # Some models use 'beneficiary' (FK), others use 'persons' (M2M)
            if hasattr(self.model, 'beneficiary'):
                qs = qs.filter(beneficiary__person_id=person_uuid)
            elif hasattr(self.model, 'persons'):
                qs = qs.filter(persons__person_id=person_uuid)
                
        return qs

    @property
    def county_field(self):
        if hasattr(self.model, "beneficiary"):
            return "beneficiary__county_resident"
        if hasattr(self.model, "persons"):
            return "persons__county_resident"
        return "county"


# ============================================================
# Dashboard (LDEA Persons view for MOYS)
# ============================================================
class MOYSDashboardViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="persons")
    def persons(self, request):
        # 1. Apply the user's scope (County-level only, bypassing Institution)
        scope = resolve_scope(request.user)
        qs = scope_queryset(
            LogInVictims.objects.all(), 
            scope, 
            county_field="incident_county", 
            check_institution=False
        )
        
        # 2. Search filter
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(middle_name__icontains=q))
            
        qs = qs.order_by("last_name", "first_name")
        
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get("page_size", 50))
        page = paginator.paginate_queryset(qs, request)

        serializer = MOYSLogInVictimSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"person/(?P<person_uuid>[^/.]+)")
    def person(self, request, person_uuid):
        # Apply scope even for a single person detail
        scope = resolve_scope(request.user)
        qs = scope_queryset(
            LogInVictims.objects.all(), 
            scope, 
            county_field="incident_county", 
            check_institution=False
        )
        
        p = qs.filter(person_id=person_uuid).first()
        if not p:
            return Response({"detail": "Person not found or outside your scope."}, status=404)
            
        serializer = MOYSLogInVictimSerializer(p, context={"request": request})
        return Response(serializer.data)


# ============================================================
# MOYS Model Viewsets
# ============================================================
class MYSReferralViewSet(MOYSBaseViewSet):
    model = MYSReferral
    scope_county_field = "persons__incident_county"
    def get_serializer_class(self):
        return MYSReferralReadSerializer if self.action in ("list", "retrieve") else MYSReferralWriteSerializer

class ReceiptDispositionViewSet(MOYSBaseViewSet):
    model = ReceiptDisposition
    scope_county_field = "persons__incident_county"
    def get_serializer_class(self):
        return ReceiptDispositionReadSerializer if self.action in ("list", "retrieve") else ReceiptDispositionWriteSerializer

class PreTreatmentReintegrationViewSet(MOYSBaseViewSet):
    model = MYSPreTreatmentReintegration
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return PreTreatmentReintegrationReadSerializer if self.action in ("list", "retrieve") else PreTreatmentReintegrationWriteSerializer

class ARYEPRegistrationViewSet(MOYSBaseViewSet):
    model = ARYEPRegistration
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return ARYEPRegistrationReadSerializer if self.action in ("list", "retrieve") else ARYEPRegistrationWriteSerializer

class ReintegrationPlanViewSet(MOYSBaseViewSet):
    model = IndividualYouthReintegrationPlan
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return ReintegrationPlanReadSerializer if self.action in ("list", "retrieve") else ReintegrationPlanWriteSerializer

class TVETViewSet(MOYSBaseViewSet):
    model = TVETSkillsTraining
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return TVETReadSerializer if self.action in ("list", "retrieve") else TVETWriteSerializer

class YouthInterventionViewSet(MOYSBaseViewSet):
    model = MYSYouthIntervention
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return YouthInterventionReadSerializer if self.action in ("list", "retrieve") else YouthInterventionWriteSerializer

class EmploymentBusinessViewSet(MOYSBaseViewSet):
    model = MYSEmploymentApprenticeshipBusiness
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return EmploymentBusinessReadSerializer if self.action in ("list", "retrieve") else EmploymentBusinessWriteSerializer

class FamilyReintegrationViewSet(MOYSBaseViewSet):
    model = MYSFamilyCommunityReintegration
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return FamilyReintegrationReadSerializer if self.action in ("list", "retrieve") else FamilyReintegrationWriteSerializer

class FollowUpViewSet(MOYSBaseViewSet):
    model = MYSReintegrationFollowUp
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return FollowUpReadSerializer if self.action in ("list", "retrieve") else FollowUpWriteSerializer

class CaseClosureViewSet(MOYSBaseViewSet):
    model = MYSCaseClosure
    scope_county_field = "beneficiary__incident_county"
    def get_serializer_class(self):
        return CaseClosureReadSerializer if self.action in ("list", "retrieve") else CaseClosureWriteSerializer

class ServiceProviderViewSet(MOYSBaseViewSet):
    model = MYSServiceProvider
    scope_county_field = "county"  # ServiceProvider actually has a direct county field
    def get_serializer_class(self):
        return ServiceProviderReadSerializer if self.action in ("list", "retrieve") else ServiceProviderWriteSerializer