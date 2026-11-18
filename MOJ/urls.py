from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MOJCaseViewSet, LegalReviewViewSet, InformationRequestViewSet,
    CourtCaseViewSet, CourtHearingViewSet, CourtOrderViewSet,
    FineViewSet, FinePaymentViewSet, AppealViewSet, CaseAssignmentViewSet
)
from .views import list_prosecutors

router = DefaultRouter()
router.register(r"cases", MOJCaseViewSet, basename="moj-cases")
router.register(r"legal-reviews", LegalReviewViewSet, basename="moj-legal-reviews")
router.register(r"info-requests", InformationRequestViewSet, basename="moj-info-requests")
router.register(r"court-cases", CourtCaseViewSet, basename="moj-court-cases")
router.register(r"hearings", CourtHearingViewSet, basename="moj-hearings")
router.register(r"orders", CourtOrderViewSet, basename="moj-orders")
router.register(r"fines", FineViewSet, basename="moj-fines")
router.register(r"payments", FinePaymentViewSet, basename="moj-payments")
router.register(r"appeals", AppealViewSet, basename="moj-appeals")
router.register(r"assignments", CaseAssignmentViewSet, basename="moj-assignments")

urlpatterns = [
    path("", include(router.urls)),
    path("prosecutors/", list_prosecutors, name="list-prosecutors"),
]