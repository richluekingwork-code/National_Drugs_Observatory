"""Serializers for the MOH app.

Follows the LDEA/MOG conventions: read serializers nest related
objects, write serializers use `*_id` inputs, system fields are never
writable.
"""

from django.db import transaction
from rest_framework import serializers
from django.utils import timezone
from LDEA.models import LogInVictims

# FIXED: Added LogInVictimReadSerializer to the imports
from LDEA.LDEA_serializer import (
    LogInVictimMinimalSerializer, 
    LogInVictimReadSerializer
)

from .models import DemandReduction, Prevention, TreatmentFacility

SYSTEM_FIELDS = (
    "institution",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
    "record_state",
)


# ============================================================
# Demand reduction
# ============================================================

class DemandReductionReadSerializer(serializers.ModelSerializer):
    # This is the field that caused the crash if not imported
    persons = LogInVictimReadSerializer(many=True, read_only=True)
    receiving_facility_name = serializers.SerializerMethodField()

    class Meta:
        model = DemandReduction
        fields = (
            "id",
            "persons",
            "treatment",
            "treatment_facility",
            "type_of_treatment",
            "cases",
            "injection_substance",
            "drug_test",
            "county",
            "city",
            "district",
            "psychotherapeutic_intervention",
            "psychotropic_interventions",
            "comorbid_conditions",
            "route_of_administration",
            "refer_from",
            "refer_to",
            "admission_status",
            "institution",
            "created_at",
            "updated_at",
            "record_state",
            "receiving_facility",
            "receiving_facility_name",
            "referral_status",
            "referred_at",
            "responded_at",
            "rejection_reason",
        )
        read_only_fields = fields

    def get_receiving_facility_name(self, obj):
        if not obj.receiving_facility_id:
            return None
        return obj.receiving_facility.facility_name


class DemandReductionWriteSerializer(serializers.ModelSerializer):
    person_ids = serializers.PrimaryKeyRelatedField(
        source="persons",
        many=True,
        queryset=LogInVictims.objects.all(),
        required=False,
    )
    receiving_facility_id = serializers.PrimaryKeyRelatedField(
        source="receiving_facility",
        queryset=TreatmentFacility.objects.filter(accepts_referrals=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = DemandReduction
        exclude = SYSTEM_FIELDS + ("persons", "receiving_facility",
                                   "referral_status", "referred_at", "responded_at",
                                   "rejection_reason",)

    def validate_person_ids(self, persons):
        seen, unique = set(), []
        for p in persons:
            if p.pk not in seen:
                seen.add(p.pk)
                unique.append(p)
        return unique

    def create(self, validated_data):
        receiving = validated_data.get("receiving_facility")
        if receiving:
            validated_data["referral_status"] = (
                DemandReduction.REFERRAL_STATUS_PENDING
            )
            validated_data["referred_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Referral status transitions go through services, not PATCH.
        validated_data.pop("referral_status", None)
        return super().update(instance, validated_data)


class IncomingReferralSerializer(serializers.ModelSerializer):
    persons = LogInVictimMinimalSerializer(many=True, read_only=True) 
    referring_institution = serializers.SerializerMethodField()
    receiving_facility_name = serializers.CharField(
        source="receiving_facility.facility_name",
    )

    class Meta:
        model = DemandReduction
        fields = (
            "id",
            "persons", 
            "referring_institution",
            "receiving_facility",
            "receiving_facility_name",
            "admission_status",
            "county",
            "referral_status",
            "referred_at",
        )
        read_only_fields = fields

    def get_referring_institution(self, obj):
        # Prevents crash if institution is null
        return obj.institution.name if obj.institution else "LDEA"

    def get_patient_names(self, obj):
        return [
            {"id": p.pk, "name": f"{p.first_name} {p.last_name}".strip()}
            for p in obj.persons.all()
        ]
        

# ============================================================
# Prevention
# ============================================================

class PreventionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prevention
        fields = (
            "id",
            "institution_name",
            "address",
            "date",
            "district",
            "county",
            "sud_awareness",
            "sud_communities",
            "school_health_club",
            "school_names",
            "media_campaign",
            "media_details",
            "harm_reduction",
            "harm_reduction_details",
            "radio_talk_show",
            "radio_details",
            "institution",
            "created_at",
            "updated_at",
            "record_state",
        )
        read_only_fields = fields


class PreventionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prevention
        exclude = SYSTEM_FIELDS

    def validate(self, attrs):
        # Each activity requires its detail field when toggled on.
        # The backend refuses partial activity records so downstream
        # analytics can assume the detail is populated.
        required_pairs = [
            ("sud_awareness", "sud_communities"),
            ("school_health_club", "school_names"),
            ("media_campaign", "media_details"),
            ("harm_reduction", "harm_reduction_details"),
            ("radio_talk_show", "radio_details"),
        ]
        for toggle, detail in required_pairs:
            value = attrs.get(toggle, getattr(self.instance, toggle, False))
            if value:
                text = attrs.get(detail, getattr(self.instance, detail, ""))
                if not text or not text.strip():
                    raise serializers.ValidationError({
                        detail: f"This field is required when {toggle.replace('_', ' ')} is enabled.",
                    })
        return attrs


# ============================================================
# Treatment facility
# ============================================================

class TreatmentFacilityReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentFacility
        fields = (
            "id",
            "facility_name",
            "facility_code",
            "facility_type",
            "ownership_type",
            "county",
            "district",
            "city_town",
            "physical_address",
            "contact_person",
            "phone_number",
            "alternate_phone",
            "email",
            "website",
            "licensed",
            "license_number",
            "license_issue_date",
            "license_expiry_date",
            "total_beds",
            "male_beds",
            "female_beds",
            "adolescent_beds",
            "current_occupancy",
            "detoxification_services",
            "inpatient_services",
            "outpatient_services",
            "counseling_services",
            "family_therapy",
            "group_therapy",
            "medication_assisted_treatment",
            "mental_health_services",
            "vocational_training",
            "aftercare_services",
            "medical_doctors",
            "psychiatrists",
            "psychologists",
            "nurses",
            "counselors",
            "social_workers",
            "peer_support_workers",
            "operational_status",
            "opening_hours",
            "accepts_referrals",
            "emergency_services_available",
            "reporting_year",
            "reporting_quarter",
            "remarks",
            "institution",
            "created_at",
            "updated_at",
            "record_state",
        )
        read_only_fields = fields


class TreatmentFacilityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentFacility
        exclude = SYSTEM_FIELDS + ("facility_code",)

    def validate(self, attrs):
        # Licensed=true requires a license number and expiry.
        licensed = attrs.get("licensed", getattr(self.instance, "licensed", False))
        if licensed:
            for field in ("license_number", "license_issue_date", "license_expiry_date"):
                value = attrs.get(field, getattr(self.instance, field, None))
                if not value:
                    raise serializers.ValidationError({
                        field: "Required when the facility is licensed.",
                    })

            # Expiry must be after issue.
            issue = attrs.get("license_issue_date", getattr(self.instance, "license_issue_date", None))
            expiry = attrs.get("license_expiry_date", getattr(self.instance, "license_expiry_date", None))
            if issue and expiry and expiry <= issue:
                raise serializers.ValidationError({
                    "license_expiry_date": "Must be after the issue date.",
                })

        # Beds sanity: subtype beds cannot exceed total.
        total = attrs.get("total_beds", getattr(self.instance, "total_beds", 0))
        for sub in ("male_beds", "female_beds", "adolescent_beds"):
            sub_val = attrs.get(sub, getattr(self.instance, sub, 0))
            if sub_val > total:
                raise serializers.ValidationError({
                    sub: f"Cannot exceed total beds ({total}).",
                })

        # Occupancy sanity.
        occ = attrs.get("current_occupancy", getattr(self.instance, "current_occupancy", 0))
        if occ > total:
            raise serializers.ValidationError({
                "current_occupancy": f"Cannot exceed total beds ({total}).",
            })

        return attrs

    def create(self, validated_data):
        return TreatmentFacility.objects.create(**validated_data)


# ============================================================
# MOH Victim List (Adds latest demand reduction ID for the frontend table)
# ============================================================

class MOHVictimListSerializer(LogInVictimReadSerializer):
    latest_demand_reduction_id = serializers.SerializerMethodField()

    class Meta(LogInVictimReadSerializer.Meta):
        fields = LogInVictimReadSerializer.Meta.fields + ("latest_demand_reduction_id",)

    def get_latest_demand_reduction_id(self, obj):
        # Grabs the most recent Demand Reduction record for this person
        # The model has ordering = ["-created_at"], so .first() gets the newest one.
        latest = obj.moh_demand_reductions.first() 
        return latest.id if latest else None