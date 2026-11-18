"""
Business services for the National Drug Observatory.

Responsibilities:
- User account creation
- User profile management
- Institutional membership management
- Account and membership status changes
- Authorization checks for privileged operations

Views and serializers should call these services instead of
duplicating business rules.
"""

from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.contrib.auth import authenticate

from core.constants import Roles
from .models import (
    Institution,
    InstitutionMembership,
    UserProfile,
)

User = get_user_model()

_INVALID_CREDENTIALS = "Invalid credentials."


def authenticate_user(*, identifier, password, request=None):
    identifier = (identifier or "").strip()
    password = password or ""

    if not identifier or not password:
        raise ValidationError(_INVALID_CREDENTIALS)

    username = identifier
    email_candidate = None
    try:
        validate_email(identifier)
        email_candidate = identifier.lower()
    except ValidationError:
        pass

    lookup = Q(username__iexact=identifier)
    if email_candidate:
        lookup |= Q(email__iexact=email_candidate)

    matched_user = User.objects.filter(lookup).only("username").first()
    if matched_user is None:
        authenticate(request=request, username=identifier, password=password)
        raise ValidationError(_INVALID_CREDENTIALS)

    user = authenticate(
        request=request, username=matched_user.username, password=password,
    )
    if user is None:
        raise ValidationError(_INVALID_CREDENTIALS)
    if not user.is_active:
        raise ValidationError(_INVALID_CREDENTIALS)

    return user


# ============================================================
# Result objects
# ============================================================

@dataclass(frozen=True)
class ServiceResult:
    ok: bool
    message: str
    data: Optional[object] = None


# ============================================================
# Authorization
# ============================================================

def _require_authenticated(actor):
    if (
            actor is None
            or not getattr(actor, "is_authenticated", False)
            or not getattr(actor, "is_active", False)
    ):
        raise PermissionDenied(
            "An authenticated, active user is required."
        )


def _get_active_membership(user, institution):
    return (
        InstitutionMembership.objects
        .filter(
            user=user,
            institution=institution,
            is_active=True,
            institution__is_active=True,
            user__is_active=True,
        )
        .first()
    )


def _require_institution_admin(actor, institution):
    """
    Superusers may administer any institution.
    Other users need an active institution_admin membership.
    """
    _require_authenticated(actor)

    if actor.is_superuser:
        return

    membership = _get_active_membership(actor, institution)

    if membership is None or membership.role != "institution_admin":
        raise PermissionDenied(
            "You do not have permission to administer this institution."
        )


def _require_can_manage_role(actor, institution, role):
    """
    Only a superuser may grant institution_admin.
    Institution administrators may create other permitted roles
    within their own institution.
    """
    _require_institution_admin(actor, institution)

    if role == "institution_admin" and not actor.is_superuser:
        raise PermissionDenied(
            "Only a system superuser may assign the "
            "institution administrator role."
        )


def _require_can_manage_membership(actor, membership):
    _require_institution_admin(actor, membership.institution)


# NEW
def _administers_user(actor, user):
    """
    True if the actor is an active institution admin of an institution
    the target user belongs to.
    """
    return InstitutionMembership.objects.filter(
        user=user,
        institution__in=InstitutionMembership.objects.filter(
            user=actor,
            role="institution_admin",
            is_active=True,
            institution__is_active=True,
        ).values("institution_id"),
    ).exists()


def _get_institution(code, *, lock=False):
    queryset = Institution.objects.all()

    if lock:
        queryset = queryset.select_for_update()

    institution = queryset.filter(code=code).first()

    if institution is None:
        raise ValidationError(
            {"institution": "The requested institution does not exist."}
        )

    if not institution.is_active:
        raise ValidationError(
            {"institution": "This institution is inactive."}
        )

    return institution


# ============================================================
# User account creation
# ============================================================

@transaction.atomic
def create_user_account(
        *,
        actor,
        username,
        email,
        password,
        institution_code,
        role,
        first_name="",
        middle_name="",
        last_name="",
        profile_data=None,
):
    """
    Create a user, their shared profile, and their first institutional
    membership in one transaction.

    The actor must be a superuser or an administrator of the target
    institution. A regular user cannot assign their own role.
    """
    username = (username or "").strip()
    email = (email or "").strip().lower()
    first_name = (first_name or "").strip()
    middle_name = (middle_name or "").strip()
    last_name = (last_name or "").strip()

    if not username:
        raise ValidationError({"username": "Username is required."})

    if not email:
        raise ValidationError({"email": "Email is required."})

    try:
        validate_email(email)
    except ValidationError:
        raise ValidationError(
            {"email": "Enter a valid email address."}
        )

    if not password:
        raise ValidationError({"password": "Password is required."})

    if User.objects.filter(
            Q(username__iexact=username) | Q(email__iexact=email)
    ).exists():
        raise ValidationError(
            "The username or email is already registered."
        )

    valid_roles = dict(InstitutionMembership.ROLE_CHOICES)

    if role not in valid_roles:
        raise ValidationError({"role": "Invalid institutional role."})

    # Locking the institution serializes concurrent membership changes
    # that follow this same locking convention.
    institution = _get_institution(institution_code, lock=True)

    _require_can_manage_role(actor, institution, role)

    # Validate against the configured Django password validators.
    candidate = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
    )
    validate_password(password, user=candidate)

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
        )

        # This service explicitly creates the profile. No signal is
        # required for this workflow.
        profile = UserProfile.objects.create(user=user)

        if profile_data:
            _apply_profile_data(
                profile,
                profile_data,
                allowed_fields={
                    "gender",
                    "phone",
                    "address",
                    "job_title",
                    "department",
                    "employee_number",
                },
            )

        membership = InstitutionMembership.objects.create(
            user=user,
            institution=institution,
            role=role,
            is_active=True,
        )

    except IntegrityError:
        # The transaction is rolled back before this error is returned.
        raise ValidationError(
            "The account could not be created. Check for duplicate "
            "usernames, emails, or memberships."
        )

    return user, profile, membership


# ============================================================
# Profile helpers
# ============================================================

def get_user_profile(user):
    """
    Retrieve an existing profile.

    Profile creation is intentionally not implicit here. Account
    creation is responsible for creating the profile transactionally.
    """
    if not getattr(user, "pk", None):
        raise ValidationError("Save the user before accessing the profile.")

    try:
        return UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        raise ValidationError(
            "The user profile is missing. Repair it through an "
            "authorized account-management operation."
        )


def _apply_profile_data(profile, data, *, allowed_fields):
    """
    Apply an explicit allow-list of model fields and validate them.
    Ownership fields and permissions cannot be changed here.
    """
    changed_fields = set()

    for field_name in allowed_fields:
        if field_name not in data:
            continue

        model_field = profile._meta.get_field(field_name)
        raw_value = data[field_name]

        if raw_value is None or raw_value == "":
            value = None if model_field.null else ""
        else:
            value = model_field.clean(raw_value, profile)

        setattr(profile, field_name, value)
        changed_fields.add(field_name)

    if changed_fields:
        profile.full_clean()
        profile.save(update_fields=sorted(changed_fields))

    return profile


# ============================================================
# Update account details
# ============================================================

@transaction.atomic
def update_user_account_fields(*, actor, user, data):
    """
    Rules:
    - A user may update their own basic account details, but may not
      change their own activation status.
    - A superuser may update any user, including activation status.
    - An institution administrator may update, and activate or
      deactivate, users who belong to an institution they administer.
      They may not touch superusers, and may not change the status of
      another institution administrator.

    `is_active` controls login capability. With one institution per
    user, an institution admin deactivating a user in their institution
    is safe: it cannot lock the user out of other institutions.
    """
    _require_authenticated(actor)

    is_self = actor.pk == user.pk
    is_active = data.get("is_active", None)

    # CHANGED: scoped permission rules replace the old
    # "own account or superuser" and "is_active is superuser-only" checks.
    if not actor.is_superuser:
        if is_self:
            if is_active is not None:
                raise PermissionDenied(
                    "You cannot change your own account status."
                )
        else:
            if user.is_superuser or not _administers_user(actor, user):
                raise PermissionDenied(
                    "You may only update users in your own institution."
                )

            if is_active is not None:
                target_is_admin = InstitutionMembership.objects.filter(
                    user=user,
                    role="institution_admin",
                    is_active=True,
                ).exists()
                if target_is_admin:
                    raise PermissionDenied(
                        "Only a system superuser may change an "
                        "administrator's account status."
                    )

    first_name = (data.get("first_name", user.first_name) or "").strip()
    middle_name = (
        data.get("middle_name", user.middle_name) or ""
    ).strip()
    last_name = (data.get("last_name", user.last_name) or "").strip()
    email = (data.get("email", user.email) or "").strip().lower()

    if not email:
        raise ValidationError({"email": "Email is required."})

    try:
        validate_email(email)
    except ValidationError:
        raise ValidationError(
            {"email": "Enter a valid email address."}
        )

    if User.objects.filter(
        email__iexact=email
    ).exclude(pk=user.pk).exists():
        raise ValidationError(
            {"email": "This email is already registered."}
        )

    user.first_name = first_name
    user.middle_name = middle_name
    user.last_name = last_name
    user.email = email

    update_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "email",
    ]
    if is_active is not None:
        user.is_active = is_active
        update_fields.append("is_active")

    try:
        user.save(update_fields=update_fields)
    except IntegrityError:
        raise ValidationError(
            {"email": "This email is already registered."}
        )

    return user


@transaction.atomic
def update_user_profile(*, actor, user, data):
    """
    Users may update their own general profile fields.
    Institution admins and superusers may also update employment identifiers.
    """
    _require_authenticated(actor)

    # Determine permissions
    is_self = actor.pk == user.pk
    is_superuser = actor.is_superuser

    # Check if the actor is an active institution admin
    # (Make sure `Roles` is imported at the top of the file: from core.constants import Roles)
    is_institution_admin = actor.institution_memberships.filter(
        role=Roles.ADMIN,
        is_active=True
    ).exists()

    # Block unauthorized users
    if not (is_self or is_superuser or is_institution_admin):
        raise PermissionDenied(
            "You may only update your own profile."
        )

    profile = get_user_profile(user)

    # Base fields anyone can edit on their own profile
    allowed = {
        "gender",
        "phone",
        "address",
        "profile_picture",
    }

    # Admins and superusers can also edit sensitive employment identifiers
    if is_superuser or is_institution_admin:
        allowed.update({
            "job_title",
            "department",
            "employee_number",
        })

    return _apply_profile_data(
        profile,
        data,
        allowed_fields=allowed,
    )


# ============================================================
# Institutional membership management
# ============================================================

@transaction.atomic
def create_institution_membership(
        *,
        actor,
        user,
        institution_code,
        role,
):
    """
    Add an existing user to another institution.

    Memberships are unique per user and institution. Role changes
    must use update_institution_membership().
    """
    valid_roles = dict(InstitutionMembership.ROLE_CHOICES)

    if role not in valid_roles:
        raise ValidationError({"role": "Invalid institutional role."})

    institution = _get_institution(institution_code, lock=True)

    _require_can_manage_role(actor, institution, role)

    if not user.is_active:
        raise ValidationError(
            {"user": "An inactive user cannot receive a new membership."}
        )

    membership, created = InstitutionMembership.objects.get_or_create(
        user=user,
        institution=institution,
        defaults={
            "role": role,
            "is_active": True,
        },
    )

    if not created:
        raise ValidationError(
            "This user already has a membership at this institution."
        )

    return membership


@transaction.atomic
def update_institution_membership(
        *,
        actor,
        membership_id,
        role=None,
        is_active=None,
        counties=None,
):
    # Find the institution first so all membership changes for that
    # institution can use the same database locking convention.
    initial = (
        InstitutionMembership.objects
        .filter(pk=membership_id)
        .values("institution_id")
        .first()
    )

    if initial is None:
        raise ValidationError(
            {"membership": "Membership not found."}
        )

    institution = (
        Institution.objects
        .select_for_update()
        .filter(pk=initial["institution_id"])
        .first()
    )

    if institution is None:
        raise ValidationError(
            {"institution": "Institution not found."}
        )

    membership = (
        InstitutionMembership.objects
        .select_for_update()
        .select_related("user", "institution")
        .filter(
            pk=membership_id,
            institution=institution,
        )
        .first()
    )

    if membership is None:
        raise ValidationError(
            {"membership": "Membership not found."}
        )

    _require_can_manage_membership(actor, membership)

    # Check the existing role BEFORE applying requested changes.
    if (membership.role == "institution_admin" and not actor.is_superuser):
        raise PermissionDenied(
            "Only a system superuser may modify an "
            "institution administrator membership."
        )
    if not membership.user.is_active:
        raise ValidationError(
            "This user's account is inactive. Reactivate it before editing the membership."
        )

    valid_roles = dict(InstitutionMembership.ROLE_CHOICES)

    if role is not None:
        if role not in valid_roles:
            raise ValidationError({"role": "Invalid institutional role."})

        if role == "institution_admin" and not actor.is_superuser:
            raise PermissionDenied(
                "Only a system superuser may assign the "
                "institution administrator role."
            )

        membership.role = role

    if is_active is not None:
        if not isinstance(is_active, bool):
            raise ValidationError(
                {"is_active": "A boolean value is required."}
            )

        membership.is_active = is_active

    # An institution must retain at least one active administrator.
    if (
            membership.role == "institution_admin"
            and not membership.is_active
    ):
        another_admin_exists = (
            InstitutionMembership.objects
            .filter(
                institution=institution,
                role="institution_admin",
                is_active=True,
                user__is_active=True,
            )
            .exclude(pk=membership.pk)
            .exists()
        )

        if not another_admin_exists:
            raise ValidationError(
                "The institution must retain at least one "
                "active administrator."
            )

    # CHANGED: de-indented so it runs on every update, not only when
    # deactivating an administrator.
    if counties is not None:
        if not isinstance(counties, list):
            raise ValidationError(
                {"counties": "A list of county names is required."}
            )
        membership.counties = sorted(
            {str(c).strip() for c in counties if str(c).strip()}
        )

    membership.full_clean()
    # CHANGED: "counties" added so the scope is actually persisted.
    membership.save(update_fields=["role", "is_active", "counties"])

    return membership


# ============================================================
# Institution-scoped queries
# ============================================================

def get_institution_memberships(*, actor, institution_code):
    """
    Return memberships only for an institution the actor administers.
    Use this for administrative membership lists.
    """
    institution = _get_institution(institution_code)
    _require_institution_admin(actor, institution)

    return (
        InstitutionMembership.objects
        .filter(institution=institution)
        .select_related("user", "institution")
        .order_by("user__last_name", "user__first_name")
    )


def get_user_memberships(user):
    """
    Return active memberships for an active user.
    """
    if not user.is_active:
        return InstitutionMembership.objects.none()

    return (
        InstitutionMembership.objects
        .filter(
            user=user,
            user__is_active=True,
            is_active=True,
            institution__is_active=True,
        )
        .select_related("institution")
        .order_by("institution__name")
    )