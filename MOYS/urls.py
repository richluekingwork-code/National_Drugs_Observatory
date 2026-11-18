# MOYS/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MOYSDashboardViewSet,
    MYSReferralViewSet, ReceiptDispositionViewSet, PreTreatmentReintegrationViewSet,
    ARYEPRegistrationViewSet, ReintegrationPlanViewSet, TVETViewSet,
    YouthInterventionViewSet, EmploymentBusinessViewSet, FamilyReintegrationViewSet,
    FollowUpViewSet, CaseClosureViewSet, ServiceProviderViewSet
)

router = DefaultRouter()

# This is the line that makes /api/moys/dashboard/persons/ work
router.register(r"dashboard", MOYSDashboardViewSet, basename="moys-dashboard")

# Your other viewsets
router.register(r"referrals", MYSReferralViewSet, basename="moys-referral")
router.register(r"receipts", ReceiptDispositionViewSet, basename="moys-receipt")
router.register(r"pre-treatment", PreTreatmentReintegrationViewSet, basename="moys-pre-treatment")
router.register(r"aryep-registrations", ARYEPRegistrationViewSet, basename="moys-aryep")
router.register(r"reintegration-plans", ReintegrationPlanViewSet, basename="moys-reintegration-plan")
router.register(r"tvet", TVETViewSet, basename="moys-tvet")
router.register(r"youth-interventions", YouthInterventionViewSet, basename="moys-youth-intervention")
router.register(r"employment-business", EmploymentBusinessViewSet, basename="moys-employment")
router.register(r"family-reintegration", FamilyReintegrationViewSet, basename="moys-family-reintegration")
router.register(r"follow-ups", FollowUpViewSet, basename="moys-follow-up")
router.register(r"case-closures", CaseClosureViewSet, basename="moys-case-closure")
router.register(r"service-providers", ServiceProviderViewSet, basename="moys-service-provider")

urlpatterns = [path("moys/", include(router.urls))]