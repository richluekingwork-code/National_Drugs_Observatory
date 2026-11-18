# urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .accountAPIView import (
    InstitutionViewSet,
    MembershipViewSet,
    UserViewSet,
    LoginView,
    LogoutView,
    MeView, ChangePasswordView, AuditLogViewSet, InstitutionDashboardView,
)

router = DefaultRouter()
router.register(r"institutions", InstitutionViewSet, basename="institution")
router.register(r"users", UserViewSet, basename="user")
router.register(r"memberships", MembershipViewSet, basename="membership")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("", include(router.urls)),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("admin/institution-dashboard/", InstitutionDashboardView.as_view()),
]
