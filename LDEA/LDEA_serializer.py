"""DRF serializers for the LDEA app.

Read serializers nest minimal representations of related objects.
Write serializers use explicit field allowlists — no `__all__`,
no writable `created_by` / `institution`.
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import (CaseParticipant, Cases, Create_Arrests, DrugRaid, DrugType, LogInVictims, Seizure,)

User = get_user_model()


# ============================================================
# Minimal nested serializers
# ============================================================

class DrugTypeMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugType
        fields = ("id", "name", "category", "photo")
        read_only_fields = fields


class ArrestedPersonMinimalSerializer(serializers.ModelSerializer):
    """Minimal representation of a Create_Arrests record (used where a
    'person' is embedded in another resource)."""

    class Meta:
        model = Create_Arrests
        fields = (
            "id",
            "arrest_id",
            "first_name",
            "last_name",
            "gender",
            "county",
        )
        read_only_fields = fields


class LogInVictimMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogInVictims
        fields = (
            "id",
            "person_id",
            "first_name",
            "last_name",
            "gender",
            "county_resident",
            "photo",
        )
        read_only_fields = fields


class SeizureMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seizure
        fields = (
            "id",
            "seizure_id",
            "seizure_date",
            "county",
            "drug_type",
            "quantity",
            "unit",
            "status",
        )
        read_only_fields = fields


class ArrestMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Create_Arrests
        fields = (
            "id",
            "arrest_id",
            "arrest_date",
            "first_name",
            "last_name",
            "county_of_arrests",
            "status",
        )
        read_only_fields = fields


class CaseMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cases
        fields = ("id", "case_id", "case_number", "title", "status")
        read_only_fields = fields


# ============================================================
# Drug type
# ============================================================

class DrugTypeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugType
        fields = (
            "id",
            "name",
            "category",
            "description",
            "common_units",
            "slug",
            "photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class DrugTypeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugType
        fields = (
            "name",
            "category",
            "description",
            "common_units",
            "photo",
        )

    def validate_name(self, value):
        value = value.strip()
        qs = DrugType.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A drug type with this name already exists."
            )
        return value


# ============================================================
# LogInVictims
# ============================================================

class LogInVictimReadSerializer(serializers.ModelSerializer):
    institution = serializers.PrimaryKeyRelatedField(read_only=True)
    age = serializers.ReadOnlyField()

    class Meta:
        model = LogInVictims
        fields = (
            "id",
            "person_id",
            "incident_date",
            "incident_time",
            "incident_county",
            "incident_location",
            "first_name",
            "middle_name",
            "last_name",
            "other_name",
            "gender",
            "age",
            "date_of_birth",
            "phone_number",
            "email",
            "county_resident", 
            "district",
            "address",
            "professional_status",
            "educational_level",
            "marital_status",
            "nationality",
            "type_of_drug_used",
            "primary_substance_user",
            "frequency_of_use",
            "last_used_date",
            "age_first_used",
            "duration_of_addiction_years",
            "method_of_use",
            "dependency_level",
            "overdose_history",
            "overdose_count",
            "mental_health_issues",
            "rehab_history",
            "rehab_details",
            "arrest_reference",
            "remarks",
            "photo",
            "institution",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class LogInVictimWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogInVictims
        fields = (
            "incident_date",
            "incident_time",
            "incident_county",
            "incident_location",
            "first_name",
            "middle_name",
            "last_name",
            "other_name",
            "gender",
            "date_of_birth",
            "phone_number",
            "email",
            "county_resident",
            "district",
            "address",
            "professional_status",
            "educational_level",
            "marital_status",
            "nationality",
            "type_of_drug_used",
            "primary_substance_user",
            "frequency_of_use",
            "last_used_date",
            "age_first_used",
            "duration_of_addiction_years",
            "method_of_use",
            "dependency_level",
            "overdose_history",
            "overdose_count",
            "mental_health_issues",
            "rehab_history",
            "rehab_details",
            "arrest_reference",
            "remarks",
            "photo",
        )

    def validate_first_name(self, value):
        return value.strip().title()

    def validate_last_name(self, value):
        return value.strip().title()

    def validate_email(self, value):
        return (value or "").strip().lower()

    def validate_date_of_birth(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )
        return value


# ============================================================
# Create_Arrests
# ============================================================

class ArrestReadSerializer(serializers.ModelSerializer):
    institution = serializers.PrimaryKeyRelatedField(read_only=True)
    age = serializers.ReadOnlyField()

    class Meta:
        model = Create_Arrests
        fields = (
            "id",
            "arrest_id",
            "arrests_number",
            "arrest_date",
            "arrest_time",
            "county_of_arrests",
            "district_of_arrests",
            "location_of_arrests",
            "first_name",
            "middle_name",
            "last_name",
            "other_name",
            "gender",
            "age",
            "photo",
            "date_of_birth",
            "phone_number",
            "email",
            "county",
            "district",
            "address",
            "professional_status",
            "educational_level",
            "marital_status",
            "nationality",
            "drug_type",
            "quantity",
            "unit",
            "charges",
            "arresting_officer",
            "badge_number",
            "status",
            "remarks",
            "institution",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ArrestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Create_Arrests
        fields = (
            "photo",
            "arrests_number",
            "arrest_date",
            "arrest_time",
            "county_of_arrests",
            "district_of_arrests",
            "location_of_arrests",
            "first_name",
            "middle_name",
            "last_name",
            "other_name",
            "gender",
            "date_of_birth",
            "phone_number",
            "email",
            "county",
            "district",
            "address",
            "professional_status",
            "educational_level",
            "marital_status",
            "nationality",
            "drug_type",
            "quantity",
            "unit",
            "charges",
            "arresting_officer",
            "badge_number",
            "status",
            "remarks",
        )

    def validate_first_name(self, value):
        return value.strip().title()

    def validate_last_name(self, value):
        return value.strip().title()

    def validate_email(self, value):
        return (value or "").strip().lower()

    def validate_date_of_birth(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )
        return value


# ============================================================
# Seizure
# ============================================================

class SeizureReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seizure
        fields = (
            "id",
            "seizure_id",
            "seizure_date",
            "seizure_time",
            "county",
            "district",
            "location_description",
            "seized_by",
            "badge_number",
            "drug_type",
            "quantity",
            "unit",
            "photo",
            "status",
            "remarks",
            "slug",
            "institution",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SeizureWriteSerializer(serializers.ModelSerializer):
    # Seizure.drug_type is a CharField in the model — do NOT wrap it in a
    # DrugType FK-related field.
    class Meta:
        model = Seizure
        fields = (
            "seizure_date",
            "seizure_time",
            "county",
            "district",
            "location_description",
            "seized_by",
            "badge_number",
            "drug_type",
            "quantity",
            "unit",
            "photo",
            "status",
            "remarks",
        )


# ============================================================
# Case + participants
# ============================================================

class CaseParticipantReadSerializer(serializers.ModelSerializer):
    person_arrested = ArrestedPersonMinimalSerializer(read_only=True)

    class Meta:
        model = CaseParticipant
        fields = ("id", "person_arrested", "role", "is_primary", "created_at")
        read_only_fields = fields


class CaseReadSerializer(serializers.ModelSerializer):
    participants = CaseParticipantReadSerializer(many=True, read_only=True)

    class Meta:
        model = Cases
        fields = (
            "id",
            "case_id",
            "case_number",
            "title",
            "description",
            "filing_date",
            "court_name",
            "county",
            "substance",
            "action_taken",
            "charge",
            "status",
            "slug",
            "institution",
            "created_at",
            "updated_at",
            "participants",
        )
        read_only_fields = fields


class CaseParticipantInputSerializer(serializers.Serializer):
    # Exposed as `person_id` for API stability; backed by person_arrested.
    person_id = serializers.PrimaryKeyRelatedField(
        source="person_arrested",
        queryset=Create_Arrests.objects.all(),
    )
    role = serializers.ChoiceField(choices=CaseParticipant.ROLE_CHOICES)
    is_primary = serializers.BooleanField(required=False, default=False)


class CaseWriteSerializer(serializers.Serializer):
    """Create/update a case together with its participants atomically."""

    case_number = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    court_name = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    county = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    substance = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    action_taken = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    charge = serializers.CharField(
        required=False, allow_blank=True, default="",
    )
    status = serializers.ChoiceField(
        choices=Cases.CASE_STATUS,
        required=False,
        default=Cases.STATUS_PENDING,
    )
    participants = CaseParticipantInputSerializer(many=True)

    def validate_case_number(self, value):
        value = value.strip()
        qs = Cases.objects.filter(case_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A case with this number already exists."
            )
        return value

    def validate_participants(self, participants):
        primaries = {}
        seen = set()
        for p in participants:
            key = (p["person_arrested"].pk, p["role"])
            if key in seen:
                raise serializers.ValidationError(
                    "Duplicate participant for the same role."
                )
            seen.add(key)
            if p.get("is_primary"):
                if p["role"] in primaries:
                    raise serializers.ValidationError(
                        f"Multiple primary {p['role']}s are not allowed."
                    )
                primaries[p["role"]] = p["person_arrested"].pk
        return participants

    def create(self, validated_data):
        participants = validated_data.pop("participants", [])
        case = Cases.objects.create(**validated_data)
        CaseParticipant.objects.bulk_create(
            [CaseParticipant(case=case, **p) for p in participants]
        )
        return case

    def update(self, instance, validated_data):
        participants = validated_data.pop("participants", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if participants is not None:
            instance.participants.all().delete()
            CaseParticipant.objects.bulk_create(
                [CaseParticipant(case=instance, **p) for p in participants]
            )
        return instance


# ============================================================
# Evidence
# ============================================================


# ============================================================
# Drug raid
# ============================================================

class DrugRaidReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugRaid
        fields = (
            "id",
            "reference_code",
            "title",
            "description",
            "location",
            "city",
            "county",
            "raid_date",
            "raid_time",
            "status",
            "lead_officer",
            "team_members",
            "total_arrests",
            "total_seizures",
            "institution",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class DrugRaidWriteSerializer(serializers.ModelSerializer):
    # lead_officer / team_members are CharFields in the model, not M2M —
    # no custom create/update needed.
    class Meta:
        model = DrugRaid
        fields = (
            "title",
            "description",
            "location",
            "city",
            "county",
            "raid_date",
            "raid_time",
            "status",
            "lead_officer",
            "team_members",
            "total_arrests",
            "total_seizures",
        )


# ============================================================
# Lookup (for pickers)
# ============================================================

class ArrestedPersonLookupSerializer(serializers.ModelSerializer):
    """Light payload for autocomplete / picker widgets."""

    class Meta:
        model = Create_Arrests
        fields = (
            "id",
            "first_name",
            "middle_name",
            "last_name",
            "county",
        )
        read_only_fields = fields
        
        
class LogInVictimLookupSerializer(serializers.ModelSerializer):
    """Light payload for autocomplete / picker widgets over LogInVictims."""

    class Meta:
        model = LogInVictims
        fields = (
            "id",
            "person_id",
            "first_name",
            "middle_name",
            "last_name",
            "gender",
            "county_resident",
            "phone_number",
        )
        read_only_fields = fields