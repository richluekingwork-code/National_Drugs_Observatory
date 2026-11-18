from rest_framework import serializers
from LDEA.models import Cases, CaseParticipant, Create_Arrests
from .models import (LegalReview, InformationRequest, CourtCase,  CourtHearing, CourtOrder, Fine, FinePayment, Appeal, CaseAssignment)

SYSTEM_FIELDS = (
    "institution", "created_by", "updated_by",
    "created_at", "updated_at", "record_state",
)

# ============================================================
# LDEA Case Read Serializers (For MOJ to view)
# ============================================================
class ArrestedPersonMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Create_Arrests
        fields = (
            "id", "arrests_number", "first_name", "middle_name", "last_name", "other_name",
            "gender", "date_of_birth", "nationality", "marital_status",
            "phone_number", "email", "address", "county", "district", 
            "county_of_arrests", "district_of_arrests", "location_of_arrests",
            "drug_type", "quantity", "unit", "arresting_officer", "charges", 
            "status", "status_display", "remarks", "full_name", "photo",
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class CaseParticipantReadSerializer(serializers.ModelSerializer):
    person_arrested = ArrestedPersonMinimalSerializer(read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = CaseParticipant
        fields = ("id", "person_arrested", "role", "role_display", "is_primary")
        read_only_fields = fields

class MOJCaseReadSerializer(serializers.ModelSerializer):
    participants = CaseParticipantReadSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    filing_institution = serializers.SerializerMethodField()

    class Meta:
        model = Cases
        fields = (
            "id", "case_id", "case_number", "title", "description",
            "filing_date", "court_name", "county", "substance",
            "action_taken", "charge", "status", "status_display",
            "participants", "filing_institution", "created_at",
            "updated_at", "record_state",
        )
        read_only_fields = fields

    def get_filing_institution(self, obj):
        return obj.institution.name if obj.institution else "LDEA"

# ADDED THIS WRITE SERIALIZER
class MOJCaseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cases
        fields = (
            "status", "court_name", "charge", "action_taken", 
            "substance", "description"
        )

# ============================================================
# MOJ New Models (Write/Read Serializers)
# ============================================================
class LegalReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)
    decision_display = serializers.CharField(source="get_decision_display", read_only=True)

    class Meta:
        model = LegalReview
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS + ("reviewer",)

class InformationRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = InformationRequest
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS + ("requested_by",)

class CourtCaseSerializer(serializers.ModelSerializer):
    original_case_number = serializers.CharField(source="original_case.case_number", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CourtCase
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class CourtHearingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtHearing
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class CourtOrderSerializer(serializers.ModelSerializer):
    judgment_type_display = serializers.CharField(source="get_judgment_type_display", read_only=True)

    class Meta:
        model = CourtOrder
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class FineSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Fine
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class FinePaymentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source="verified_by.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = FinePayment
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class AppealSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appeal
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS

class CaseAssignmentSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CaseAssignment
        fields = "__all__"
        read_only_fields = SYSTEM_FIELDS