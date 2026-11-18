from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AssessmentViewSet, FollowUpViewSet, TracingViewSet,
    VerificationViewSet, HandoverViewSet, TracingActionViewSet,
    OutreachViewSet, CaseClosureViewSet, DashboardViewSet,
    ChildTrackingViewSet,
)
router = DefaultRouter()
router.register(r"assessments",     AssessmentViewSet,    basename="mog-assessment")
router.register(r"followups",       FollowUpViewSet,      basename="mog-followup")
router.register(r"tracings",        TracingViewSet,       basename="mog-tracing")
router.register(r"verifications",   VerificationViewSet,  basename="mog-verification")
router.register(r"handovers",       HandoverViewSet,      basename="mog-handover")
router.register(r"tracing-actions", TracingActionViewSet, basename="mog-tracing-action")
router.register(r"outreach",        OutreachViewSet,      basename="mog-outreach")
router.register(r"case-closures",   CaseClosureViewSet,   basename="mog-closure")
router.register(r"child-tracking",  ChildTrackingViewSet, basename="mog-child-tracking")
router.register(r"dashboard",       DashboardViewSet,     basename="mog-dashboard")
urlpatterns = [path("mog/", include(router.urls))]
