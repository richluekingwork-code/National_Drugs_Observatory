from django.contrib.auth import get_user_model
from django.core.exceptions import (
    PermissionDenied as DjangoPermissionDenied,
    ValidationError as DjangoValidationError,
)
from django.core.validators import validate_email
from django.db import IntegrityError
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from core.constants import Roles
from .models import (
    Institution,
    InstitutionMembership,
    UserProfile,
    UserActivityLog,
)
from . import services

User = get_user_model()


# ============================================================
# Exception translation
# ============================================================

def raise_api_validation_error(exc):
    """
    Translate Django validation errors into DRF validation errors.
    This ensures invalid client input normally produces HTTP 400
    rather than an unhandled server error.
    """
    if hasattr(exc, "message_dict"):
        raise serializers.ValidationError(exc.message_dict)

    raise serializers.ValidationError(exc.messages)


def run_service(operation, *args, **kwargs):
    """
    Convert expected domain errors into appropriate DRF exceptions.
    Unexpected programming errors should remain visible to monitoring
    rather than being disguised as client validation failures.
    """
    try:
        return operation(*args, **kwargs)
    except DjangoValidationError as exc:
        raise_api_validation_error(exc)
    except DjangoPermissionDenied as exc:
        raise PermissionDenied(str(exc) or "Permission denied.")
    except IntegrityError:
        raise serializers.ValidationError(
            "The operation conflicts with existing database records."
        )


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        max_length=254, trim_whitespace=True, write_only=True,
    )
    password = serializers.CharField(
        write_only=True, trim_whitespace=False,
        style={"input_type": "password"}
    )

    def validate_identifier(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "Provide a username or email"
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = run_service(
            services.authenticate_user,
            identifier=attrs["identifier"],
            password=attrs["password"],
            request=request,
        )

        attrs["user"] = user
        return attrs


# ============================================================
# Read-only institution representation
# ============================================================

class InstitutionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = (
            "id",
            "code",
            "name",
            "description",
            "is_active",
        )
        read_only_fields = fields

class InstitutionWriteSerializer(serializers.ModelSerializer):
    """
    Create / update an Institution row.

    `name` is derived from `code` (both use the same INSTITUTION_CHOICES
    list and are unique), so the client only sends `code`.
    The code itself is immutable once created.
    """
    code = serializers.ChoiceField(choices=Institution.INSTITUTION_CHOICES)

    class Meta:
        model = Institution
        fields = ("code", "description", "is_active")

    def validate_code(self, value):
        if self.instance is not None and self.instance.code != value:
            raise serializers.ValidationError(
                "Institution code cannot be changed after creation."
            )
        return value

    def create(self, validated_data):
        validated_data["name"] = validated_data["code"]
        return super().create(validated_data)

# ============================================================
# Shared profile representation
# ============================================================

class UserProfileReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "id",
            "gender",
            "phone",
            "address",
            "profile_picture",
            "job_title",
            "department",
            "employee_number",
        )
        read_only_fields = fields


class UserProfileInputSerializer(serializers.Serializer):
    """
    Explicit allowlist for profile fields accepted during account
    creation. Ownership and institution permissions are not writable.
    """
    gender = serializers.ChoiceField(
        choices=UserProfile._meta.get_field("gender").choices,
        required=False,
        allow_blank=True,
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    address = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True,
    )
    job_title = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    department = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    employee_number = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )


# ============================================================
# Account creation
# ============================================================

class UserCreateSerializer(serializers.Serializer):
    """
    Creates an account and its initial profile/membership through
    the business service.

    The actor is taken from the authenticated request contexts,
    never from client-supplied JSON.
    """
    username = serializers.CharField(
        max_length=150,
        trim_whitespace=True,
    )
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    middle_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    institution_code = serializers.ChoiceField(
        choices=Institution.INSTITUTION_CHOICES,
    )
    role = serializers.ChoiceField(
        choices=InstitutionMembership.ROLE_CHOICES,
    )
    profile = UserProfileInputSerializer(
        required=False,
        write_only=True,
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username cannot be empty."
            )

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "This username is already registered."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError(
                "Enter a valid email address."
            )

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise PermissionDenied(
                "Authentication is required to create an account."
            )

        # The service performs authoritative permission checks,
        # including institution membership and role assignment.
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        profile_data = validated_data.pop("profile", {})

        result = run_service(
            services.create_user_account,
            actor=request.user,
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            institution_code=validated_data["institution_code"],
            role=validated_data["role"],
            first_name=validated_data.get("first_name", ""),
            middle_name=validated_data.get("middle_name", ""),
            last_name=validated_data.get("last_name", ""),
            profile_data=profile_data,
        )

        user, profile, membership = result

        # Return the created objects to the view. Never return the
        # raw password or password hash in the API response.
        self.created_profile = profile
        self.created_membership = membership

        return user


# ============================================================
# Safe account representation
# ============================================================

class UserReadSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    memberships = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "is_active",
            "date_joined",
            "profile",
            "memberships",
            "is_superuser", "is_staff",
        )
        read_only_fields = fields

    def get_profile(self, obj):
        try:
            profile = obj.profile
        except UserProfile.DoesNotExist:
            return None

        return UserProfileReadSerializer(
            profile,
            context=self.context,
        ).data

    def get_memberships(self, obj):
        """
        Return only active memberships for normal account responses.
        Institution-specific authorization still belongs in views
        and querysets.
        """
        memberships = (
            obj.institution_memberships
            .filter(
                is_active=True,
                institution__is_active=True,
            )
            .select_related("institution")
            .order_by("institution__name")
        )

        return MembershipReadSerializer(
            memberships,
            many=True,
            context=self.context,
        ).data


# ============================================================
# Account self-service updates
# ============================================================

class UserAccountUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, trim_whitespace=True,)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True, trim_whitespace=True,)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, trim_whitespace=True,)
    email = serializers.EmailField(max_length=254, required=False,)
    
    is_active = serializers.BooleanField(required=False) 

    def validate_email(self, value):
        user = self.instance
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def update(self, instance, validated_data):
        request = self.context.get("request")

        updated = run_service(
            services.update_user_account_fields,
            actor = request.user if request else None, user=instance, data=validated_data,)
        return updated

    def create(self, validated_data):
        raise NotImplementedError(
            "Use UserCreateSerializer to create accounts."
        )


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Restrict updates to editable profile fields.
    The user relationship is deliberately absent from the writable
    field set.
    """

    class Meta:
        model = UserProfile
        fields = (
            "gender",
            "phone",
            "address",
            "profile_picture",
            "job_title",
            "department",
            "employee_number",
        )

    def update(self, instance, validated_data):
        request = self.context.get("request")

        updated = run_service(
            services.update_user_profile,
            actor=request.user if request else None,
            user=instance.user,
            data=validated_data,
        )

        return updated

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            target_user = self.instance.user

            # 1. Is the user updating their own profile?
            is_self = request.user.id == target_user.id

            # 2. Is the user a superuser?
            is_superuser = request.user.is_superuser

            # 3. Is the user an institution admin?
            is_institution_admin = request.user.institution_memberships.filter(
                role=Roles.ADMIN,
                is_active=True
            ).exists()

            # If none of the above are true, block the request
            if not (is_self or is_superuser or is_institution_admin):
                raise PermissionDenied("You may only update your own profile.")

        return attrs


# ============================================================
# Membership representations and operations
# ============================================================

class MembershipReadSerializer(serializers.ModelSerializer):
    institution = InstitutionReadSerializer(read_only=True)
    user_id = serializers.ReadOnlyField(source="user.pk")
    username = serializers.ReadOnlyField(source="user.username")
    user_email = serializers.ReadOnlyField(source="user.email")
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = InstitutionMembership
        fields = (
            "id",
            "user_id",
            "username",
            "user_email",
            "institution",
            "role",
            "is_active",
            "counties",
            "created_at",
            "user_is_active",
        )
        read_only_fields = fields


class MembershipCreateSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.filter(is_active=True),
    )
    institution_code = serializers.ChoiceField(
        choices=Institution.INSTITUTION_CHOICES,
    )
    role = serializers.ChoiceField(
        choices=InstitutionMembership.ROLE_CHOICES,
    )

    def create(self, validated_data):
        request = self.context.get("request")

        if request is None:
            raise PermissionDenied("Request contexts is required.")

        membership = run_service(
            services.create_institution_membership,
            actor=request.user,
            user=validated_data["user"],
            institution_code=validated_data["institution_code"],
            role=validated_data["role"],
        )

        return membership

    def update(self, instance, validated_data):
        raise NotImplementedError(
            "Use MembershipUpdateSerializer to update memberships."
        )


class MembershipUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=InstitutionMembership.ROLE_CHOICES,
        required=False,
    )
    is_active = serializers.BooleanField(required=False)
    counties = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "Provide at least one field to update."
            )

        return attrs

    def update(self, instance, validated_data):
        request = self.context.get("request")
        counties = validated_data.pop("counties", None)
        if request is None:
            raise PermissionDenied("Request contexts is required.")

        membership = run_service(
            services.update_institution_membership,
            actor=request.user,
            membership_id=instance.pk,
            role=validated_data.get("role"),
            is_active=validated_data.get("is_active"),
        )
        if counties is not None:
            # Only superusers or institution admins can change county scope.
            membership.counties = [c.strip() for c in counties if c.strip()]
            membership.save(update_fields=["counties"])

        return membership

    def create(self, validated_data):
        raise NotImplementedError(
            "Use MembershipCreateSerializer to create memberships."
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True, trim_whitespace=False,
    )
    new_password = serializers.CharField(
        write_only=True, trim_whitespace=False,
    )

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        try:
            validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value
    
# ============================================================
# User Activity Log (Audit)
# ============================================================

class UserActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    institution_name = serializers.CharField(source="institution.name", default=None, read_only=True)
    class Meta:
        model = UserActivityLog
        fields = ("id", "username", "full_name", "institution", "institution_name",
                  "action", "ip_address", "device_info", "location", "timestamp")

    def get_username(self, obj):
        return obj.user.username if obj.user else "Unknown"

    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else "Unknown User"