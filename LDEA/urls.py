from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .LDEA_APIview import (
    ArrestedPersonLookupDetailView,
    ArrestedPersonLookupView,
    ArrestViewSet,
    CasesViewSet,
    DashboardViewSet,
    DrugRaidViewSet,
    DrugTypeViewSet,
    LogInVictimLookupDetailView,
    LogInVictimLookupView,
    LogInVictimViewSet,
    SeizureViewSet,
)

router = DefaultRouter()
router.register(r"drug-types", DrugTypeViewSet, basename="drug-type")
router.register(r"victims", LogInVictimViewSet, basename="victim")
router.register(r"seizures", SeizureViewSet, basename="seizure")
router.register(r"arrests", ArrestViewSet, basename="arrest")
router.register(r"cases", CasesViewSet, basename="case")
router.register(r"drug-raids", DrugRaidViewSet, basename="drug-raid")
router.register(r"dashboard", DashboardViewSet, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
    path("arrested-persons/lookup/", ArrestedPersonLookupView.as_view(), name="arrested-person-lookup"),
    path("arrested-persons/lookup/<int:pk>/", ArrestedPersonLookupDetailView.as_view(), name="arrested-person-lookup-detail"),
    path("victims/lookup/", LogInVictimLookupView.as_view(), name="victim-lookup"),
    path("victims/lookup/<int:pk>/", LogInVictimLookupDetailView.as_view(), name="victim-lookup-detail"),
]