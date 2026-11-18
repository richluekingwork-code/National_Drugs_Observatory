from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DemandReductionViewSet,
    PreventionViewSet,
    TreatmentFacilityViewSet, MOHDashboardViewSet, MOHVictimViewSet,
)

router = DefaultRouter()
router.register(r"victims", MOHVictimViewSet, basename="moh-victim")
router.register(r"demand-reductions", DemandReductionViewSet, basename="moh-demand-reduction",)
router.register(r"prevention", PreventionViewSet, basename="moh-prevention")
router.register(r"treatment-facilities", TreatmentFacilityViewSet, basename="moh-treatment-facility",)
router.register(r"dashboard", MOHDashboardViewSet, basename="moh-dashboard")
urlpatterns = [path("moh/", include(router.urls))]