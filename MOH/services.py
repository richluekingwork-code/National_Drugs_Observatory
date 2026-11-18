"""Business services for MOH referrals.

The acceptance and refusal of a referral is the only state-changing
action on a DemandReduction that isn't a standard update — it needs a
side-effect timestamp and a permission check against the *receiving*
facility, not the referring institution.
"""

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from accounts.models import InstitutionMembership
from core.models import SoftDeleteManager

from .models import DemandReduction


def _require_authenticated(actor):
    if (
            actor is None
            or not getattr(actor, "is_authenticated", False)
            or not getattr(actor, "is_active", False)
    ):
        raise PermissionDenied("An authenticated, active user is required.")


def _require_can_respond(actor, referral):
    """
    The caller must belong to the institution that owns the receiving
    facility. Superusers bypass the check.
    """
    _require_authenticated(actor)
    if actor.is_superuser:
        return

    if referral.receiving_facility_id is None:
        raise ValidationError(
            "This record has no structured receiving facility."
        )

    facility_inst_id = referral.receiving_facility.institution_id
    allowed = InstitutionMembership.objects.filter(
        user=actor,
        institution_id=facility_inst_id,
        is_active=True,
        institution__is_active=True,
        role__in=["institution_admin", "department_head", "data_officer"],
    ).exists()
    if not allowed:
        raise PermissionDenied(
            "You do not have permission to respond to referrals for "
            "this facility."
        )


@transaction.atomic
def accept_referral(*, actor, referral_id):
    referral = (
        DemandReduction.objects
        .select_for_update()
        .select_related("receiving_facility")
        .filter(pk=referral_id)
        .first()
    )
    if referral is None:
        raise ValidationError({"referral": "Referral not found."})

    if referral.referral_status != DemandReduction.REFERRAL_STATUS_PENDING:
        raise ValidationError(
            {"referral": "Only pending referrals can be accepted."}
        )

    _require_can_respond(actor, referral)

    referral.referral_status = DemandReduction.REFERRAL_STATUS_ACCEPTED
    referral.responded_at = timezone.now()
    referral.updated_by = actor
    referral.save(
        update_fields=[
            "referral_status", "responded_at",
            "updated_by", "updated_at",
        ],
    )
    return referral


@transaction.atomic
def decline_referral(*, actor, referral_id, reason=""):
    referral = (
        DemandReduction.objects
        .select_for_update()
        .select_related("receiving_facility")
        .filter(pk=referral_id)
        .first()
    )
    if referral is None:
        raise ValidationError({"referral": "Referral not found."})

    if referral.referral_status != DemandReduction.REFERRAL_STATUS_PENDING:
        raise ValidationError(
            {"referral": "Only pending referrals can be declined."}
        )

    _require_can_respond(actor, referral)

    referral.referral_status = DemandReduction.REFERRAL_STATUS_DECLINED
    referral.responded_at = timezone.now()
    referral.rejection_reason = (reason or "").strip()
    referral.updated_by = actor
    referral.save(
        update_fields=[
            "referral_status", "responded_at", "rejection_reason",
            "updated_by", "updated_at",
        ],
    )
    return referral
