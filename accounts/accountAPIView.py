import json
import urllib.request
from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied, ValidationError
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from core.constants import Roles
from core.permissions import IsInstitutionAdmin
from .models import (
    Institution, 
    InstitutionMembership, 
    UserProfile, 
    UserActivityLog,
)

from .account_serializer import (
    InstitutionReadSerializer,
    InstitutionWriteSerializer,
    MembershipCreateSerializer,
    MembershipReadSerializer,
    MembershipUpdateSerializer,
    UserAccountUpdateSerializer,
    UserCreateSerializer,
    UserProfileReadSerializer,
    UserProfileUpdateSerializer,
    UserReadSerializer,
    LoginSerializer, 
    ChangePasswordSerializer,
    UserActivityLogSerializer,
)
from .audit import create_user_activity_log

User = get_user_model()

# ============================================================
# Helper Functions for Audit Logs
# ============================================================

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_device_info(request):
    return request.META.get('HTTP_USER_AGENT', 'Unknown Device')


# ============================================================
# Auth Views
# ============================================================

class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(
            UserReadSerializer(request.user, context={"request": request}).data
        )

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = UserAccountUpdateSerializer(
            request.user,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserReadSerializer(user, context={"request": request}).data
        )


# ============================================================
# Shared query helpers
# ============================================================
def _administered_institution_ids(user):
    return list(
        InstitutionMembership.objects.filter(
            user=user,
            role=Roles.ADMIN,
            is_active=True,
            institution__is_active=True,
            user__is_active=True,
        ).values_list("institution_id", flat=True)
    )

def _admin_institution_ids(self):
    return list(
        self.request.user.institution_memberships.filter(
            is_active=True, institution__is_active=True, role=Roles.ADMIN
        ).values_list("institution_id", flat=True)
    )


# ============================================================
# Institutions
# ============================================================
class InstitutionViewSet(viewsets.ModelViewSet):
    serializer_class = InstitutionReadSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Institution.objects.all()

        if user.is_superuser:
            return qs.order_by("name")

        institution_ids = InstitutionMembership.objects.filter(
            user=user,
            is_active=True,
            institution__is_active=True,
            user__is_active=True,
        ).values_list("institution_id", flat=True)

        return qs.filter(
            id__in=institution_ids,
            is_active=True,
        ).order_by("name")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return InstitutionWriteSerializer
        return InstitutionReadSerializer

    def _require_superuser(self):
        if not self.request.user.is_superuser:
            raise PermissionDenied(
                "Only a system superuser may manage institutions."
            )

    def create(self, request, *args, **kwargs):
        self._require_superuser()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_superuser()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._require_superuser()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE")

    @action(detail=False, methods=["post"], url_path="seed")
    def seed(self, request):
        self._require_superuser()

        created, existing = [], []
        for code, _label in Institution.INSTITUTION_CHOICES:
            _, was_created = Institution.objects.get_or_create(
                code=code,
                defaults={"name": code},
            )
            (created if was_created else existing).append(code)

        return Response({
            "created": created,
            "existing": existing,
            "total": Institution.objects.count(),
        })

# ============================================================
# Users
# ============================================================
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = (
            User.objects
            .select_related("profile")
            .prefetch_related("institution_memberships__institution")
        )
        inst = self.request.query_params.get("institution")

        if user.is_superuser:
            if inst:
                qs = qs.filter(institution_memberships__institution_id=inst).distinct()
            return qs.order_by("username")

        admin_ids = _administered_institution_ids(user)
        if not admin_ids:
            return qs.filter(pk=user.pk)  # regular users see only themselves

        scope = admin_ids
        if inst and inst.isdigit() and int(inst) in admin_ids:
            scope = [int(inst)]

        # Membership is not filtered by is_active, so admins can still see
        # and reactivate deactivated users in their institution.
        return (
            qs.filter(
                Q(pk=user.pk)
                | Q(institution_memberships__institution_id__in=scope, is_superuser=False)
            )
            .distinct()
            .order_by("username")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer

        if self.action in ("update", "partial_update"):
            return UserAccountUpdateSerializer

        return UserReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        output = UserReadSerializer(
            user,
            context=self.get_serializer_context(),
        )
        headers = self.get_success_headers(output.data)

        return Response(
            output.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)  # was serializer.save()
        output = UserReadSerializer(
            serializer.instance, context=self.get_serializer_context()
        )
        return Response(output.data)

    @action(detail=True, methods=["get", "put", "patch"], url_path="profile")
    def profile(self, request, pk=None):
        user = self.get_object()
        profile = get_object_or_404(UserProfile, user=user)

        if request.method.lower() == "get":
            output = UserProfileReadSerializer(
                profile,
                context=self.get_serializer_context(),
            )
            return Response(output.data)

        partial = request.method == "PATCH"

        serializer = UserProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=partial,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)

        updated_profile = serializer.save()

        output = UserProfileReadSerializer(
            updated_profile,
            context=self.get_serializer_context(),
        )

        return Response(output.data)

    @action(detail=False, methods=["get", "put", "patch"], url_path="me")
    def me(self, request):
        user = request.user

        if request.method.lower() == "get":
            output = UserReadSerializer(
                user,
                context=self.get_serializer_context(),
            )
            return Response(output.data)

        partial = request.method == "PATCH"

        serializer = UserAccountUpdateSerializer(
            user,
            data=request.data,
            partial=partial,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)

        updated_user = serializer.save()

        output = UserReadSerializer(
            updated_user,
            context=self.get_serializer_context(),
        )

        return Response(output.data)

    def perform_update(self, serializer):
        actor = self.request.user
        target = serializer.instance
        data = serializer.validated_data

        if not actor.is_superuser:
            is_admin = bool(_administered_institution_ids(actor))

            if "is_active" in data:
                if not is_admin:
                    raise PermissionDenied("You cannot change account status.")
                if target.pk == actor.pk and data["is_active"] is False:
                    raise PermissionDenied("You cannot deactivate your own account.")

            forbidden = {"is_superuser", "is_staff", "groups", "user_permissions"}
            if forbidden & set(data):
                raise PermissionDenied("You cannot change user privileges.")

        serializer.save()


# ============================================================
# Memberships
# ============================================================
class MembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user

        qs = InstitutionMembership.objects.select_related(
            "user",
            "institution",
        )

        if user.is_superuser:
            return qs.order_by(
                "institution__name", "user__username"
            )

        admin_ids = _administered_institution_ids(user)

        return qs.filter(
            Q(user=user)
            | Q(institution_id__in=admin_ids)
        ).distinct().order_by(
            "institution__name", "user__username"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return MembershipCreateSerializer

        if self.action in ("update", "partial_update"):
            return MembershipUpdateSerializer

        return MembershipReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        membership = serializer.save()

        output = MembershipReadSerializer(
            membership,
            context=self.get_serializer_context(),
        )
        headers = self.get_success_headers(output.data)

        return Response(
            output.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)

        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)

        membership = serializer.save()

        output = MembershipReadSerializer(
            membership,
            context=self.get_serializer_context(),
        )

        return Response(output.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                OutstandingToken, BlacklistedToken,
            )
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)

# ============================================================
# Audit Logs (Superuser and Institution admin)
# ============================================================

def is_institution_admin(user):
    if not user or not user.is_authenticated:
        return False
    return user.institution_memberships.filter(
        role=Roles.ADMIN, is_active=True, institution__is_active=True,).exists()


class CanViewAuditLogs(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or is_institution_admin(user))
        )


class AuditLogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/audit-logs/

    Superuser:
        Can view all institutions' logs.
        Can optionally filter by institution_id.

    Institution admin:
        Can only view logs belonging to their institution.
    """

    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLogs,]
    pagination_class = AuditLogPagination

    def get_queryset(self):
        user = self.request.user
        queryset = UserActivityLog.objects.select_related(
            "user","institution",).order_by("-timestamp")
        # 1. Superuser can view all institutions.
        if user.is_superuser:
            institution_id = (self.request.query_params.get("institution_id")or self.request.query_params.get("institution")
            )
            if institution_id:queryset = queryset.filter(institution_id=institution_id)
        else:
            # 2. Get the user's active institution membership.
            membership = user.institution_memberships.filter(role=Roles.ADMIN,is_active=True,institution__is_active=True,).select_related("institution").first()
            if not membership:
                return queryset.none()
            # 3. Restrict the admin to their institution.
            queryset = queryset.filter(institution=membership.institution)
        # 4. Optional action filter.
        action_filter = self.request.query_params.get("action")
        if action_filter:
            queryset = queryset.filter(action=action_filter)

        # 5. Optional search filter.
        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(ip_address__icontains=search)
                | Q(device_info__icontains=search)
            )

        return queryset
    
def get_location_from_ip(ip):
    """Fetches city and country from a free IP API."""
    if not ip or ip == "127.0.0.1" or ip == "localhost":
        return "Localhost"
    
    try:
        # Using a free, no-key-required IP geolocation API
        with urllib.request.urlopen(f"http://ip-api.com/json/{ip}", timeout=2) as response:
            data = json.loads(response.read().decode())
            if data.get("status") == "success":
                city = data.get("city", "")
                country = data.get("country", "")
                return f"{city}, {country}".strip(", ")
    except Exception:
        pass
        
    return "Unknown Location"

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        
        # Get the IP once so we can use it for both the log and the location lookup
        client_ip = get_client_ip(request)

        # 1. Log failed login attempts
        if not serializer.is_valid():
            identifier = (request.data.get("email")or request.data.get("username"))
            failed_user = None
            if identifier:
                try:
                    failed_user = User.objects.get_by_natural_key(identifier)
                except User.DoesNotExist:
                    pass

            create_user_activity_log(
                user=failed_user,
                action="login_failed",
                ip_address=client_ip,
                device_info=get_device_info(request),
                location=get_location_from_ip(client_ip),
            )

            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        # 2. Log successful login
        create_user_activity_log(
            user=user,
            action="login",
            ip_address=client_ip,
            device_info=get_device_info(request),
            location=get_location_from_ip(client_ip)
        )

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserReadSerializer(
                    user,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        client_ip = get_client_ip(request)

        # 3. Log the logout action
        create_user_activity_log(
            user=request.user,
            action="logout",
            ip_address=client_ip,
            device_info=get_device_info(request),
            location=get_location_from_ip(client_ip)
        )

        if not refresh_token:
            return Response(status=status.HTTP_205_RESET_CONTENT)

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass

        return Response(status=status.HTTP_205_RESET_CONTENT)


class InstitutionDashboardView(APIView):
    """GET /api/admin/institution-dashboard/?institution_id=<id>
    Stats for ONE institution. Admins can only request institutions they administer."""
    permission_classes = [IsAuthenticated, IsInstitutionAdmin]

    def get(self, request):
        user = request.user
        Membership = user.institution_memberships.model
        Institution = Membership._meta.get_field("institution").related_model

        admin_ids = list(
            user.institution_memberships.filter(
                is_active=True, institution__is_active=True, role=Roles.ADMIN
            ).values_list("institution_id", flat=True)
        )

        raw = request.query_params.get("institution_id") or request.query_params.get("institution")
        if raw is None:
            if len(admin_ids) == 1:
                inst_id = admin_ids[0]
            else:
                raise ValidationError("institution_id is required.")
        else:
            try:
                inst_id = int(raw)
            except ValueError:
                raise ValidationError("Invalid institution_id.")

        if not user.is_superuser and inst_id not in admin_ids:
            raise PermissionDenied("You do not administer this institution.")

        institution = Institution.objects.filter(pk=inst_id).first()
        if not institution:
            raise ValidationError("Institution not found.")

        now = timezone.now()
        d7, d30 = now - timedelta(days=7), now - timedelta(days=30)

        members = Membership.objects.filter(institution_id=inst_id).select_related("user")
        active_members = members.filter(is_active=True, user__is_active=True)

        roles = (
            members.filter(is_active=True)
            .values("role").annotate(count=Count("id")).order_by("-count")
        )

        logs = UserActivityLog.objects.filter(institution_id=inst_id)
        actions = (
            logs.filter(timestamp__gte=d30)
            .values("action").annotate(count=Count("id"))
        )

        recent = logs.select_related("user", "institution")[:8]

        return Response({
            "institution": {"id": institution.pk, "name": str(institution)},
            "totals": {
                "users": members.values("user_id").distinct().count(),
                "active_users": active_members.values("user_id").distinct().count(),
                "inactive_users": members.exclude(
                    pk__in=active_members.values("pk")
                ).values("user_id").distinct().count(),
                "admins": members.filter(is_active=True, role=Roles.ADMIN).count(),
                "logins_7d": logs.filter(action="login", timestamp__gte=d7).count(),
                "failed_7d": logs.filter(action="login_failed", timestamp__gte=d7).count(),
                "active_logins_7d": logs.filter(action="login", timestamp__gte=d7)
                                        .values("user_id").distinct().count(),
            },
            "roles": list(roles),
            "actions_30d": list(actions),
            "recent": UserActivityLogSerializer(recent, many=True).data,
        })