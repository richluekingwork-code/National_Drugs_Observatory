from django.db import transaction
from rest_framework import serializers
from LDEA.models import LogInVictims
from LDEA.LDEA_serializer import LogInVictimMinimalSerializer
from .models import (
    BeneficiaryHandover, BeneficiaryVerification, CaseClosure, CaseClosureApproval,
    ChildAdultAssessment, CommunityOutreachReport, FamilyMember,
    FamilyTracingVerification, FollowUpVisit, TracingActionDetail, TracingActionTaken,
    ChildTrackingRecord,
)

SYS = ("institution", "created_by", "updated_by", "created_at", "updated_at", "record_state")
PERSONS = LogInVictims.objects


class ChildTrackingReadSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)

    class Meta:
        model = ChildTrackingRecord
        fields = "__all__"


class ChildTrackingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildTrackingRecord
        exclude = SYS


class AssessmentReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    class Meta:
        model = ChildAdultAssessment
        fields = "__all__"


class AssessmentWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    class Meta:
        model = ChildAdultAssessment
        exclude = SYS + ("person",)

    def validate(self, attrs):
        person = attrs.get("person") or getattr(self.instance, "person", None)
        consent = attrs.get("consent_assent_completed",
                            getattr(self.instance, "consent_assent_completed", False))
        if person and not consent:
            raise serializers.ValidationError({
                "consent_assent_completed": "Consent or assent must be completed before saving.",
            })
        return attrs


class FollowUpReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    class Meta:
        model = FollowUpVisit
        fields = "__all__"


class FollowUpWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    class Meta:
        model = FollowUpVisit
        exclude = SYS + ("person",)


class FamilyMemberReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("id", "name", "relationship", "address", "created_at")


class FamilyMemberWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ("name", "relationship", "address")


class TracingReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    family_members = FamilyMemberReadSerializer(many=True, read_only=True)
    class Meta:
        model = FamilyTracingVerification
        fields = "__all__"


class TracingWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    family_members = FamilyMemberWriteSerializer(many=True, required=False)
    class Meta:
        model = FamilyTracingVerification
        exclude = SYS + ("person",)

    @transaction.atomic
    def create(self, validated_data):
        members = validated_data.pop("family_members", [])
        obj = FamilyTracingVerification.objects.create(**validated_data)
        FamilyMember.objects.bulk_create([FamilyMember(tracing=obj, **m) for m in members])
        return obj

    @transaction.atomic
    def update(self, instance, validated_data):
        members = validated_data.pop("family_members", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if members is not None:
            instance.family_members.all().delete()
            FamilyMember.objects.bulk_create([FamilyMember(tracing=instance, **m) for m in members])
        return instance


class VerificationReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    class Meta:
        model = BeneficiaryVerification
        fields = "__all__"


class VerificationWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    class Meta:
        model = BeneficiaryVerification
        exclude = SYS + ("person",)


class HandoverReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    class Meta:
        model = BeneficiaryHandover
        fields = "__all__"


class HandoverWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    class Meta:
        model = BeneficiaryHandover
        exclude = SYS + ("person",)

    def validate_reunification_date(self, value):
        from django.utils import timezone
        if value > timezone.localdate():
            raise serializers.ValidationError("Reunification date cannot be in the future.")
        return value


class TracingActionDetailReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TracingActionDetail
        fields = "__all__"


class TracingActionDetailWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TracingActionDetail
        exclude = ("id", "tracing_record")


class TracingActionReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    actions = TracingActionDetailReadSerializer(many=True, read_only=True)
    class Meta:
        model = TracingActionTaken
        fields = "__all__"


class TracingActionWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    actions = TracingActionDetailWriteSerializer(many=True, required=False)
    class Meta:
        model = TracingActionTaken
        exclude = SYS + ("person",)

    @transaction.atomic
    def create(self, validated_data):
        actions = validated_data.pop("actions", [])
        obj = TracingActionTaken.objects.create(**validated_data)
        TracingActionDetail.objects.bulk_create([TracingActionDetail(tracing_record=obj, **a) for a in actions])
        return obj

    @transaction.atomic
    def update(self, instance, validated_data):
        actions = validated_data.pop("actions", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if actions is not None:
            instance.actions.all().delete()
            TracingActionDetail.objects.bulk_create([TracingActionDetail(tracing_record=instance, **a) for a in actions])
        return instance


class OutreachReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    class Meta:
        model = CommunityOutreachReport
        fields = "__all__"


class OutreachWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    class Meta:
        model = CommunityOutreachReport
        exclude = SYS + ("person",)


class CaseClosureApprovalReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseClosureApproval
        fields = ("id", "role", "name", "agency", "contact_details", "signature")


class CaseClosureApprovalWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseClosureApproval
        fields = ("role", "name", "agency", "contact_details", "signature")


class CaseClosureReadSerializer(serializers.ModelSerializer):
    person = LogInVictimMinimalSerializer(read_only=True)
    approvals = CaseClosureApprovalReadSerializer(many=True, read_only=True)
    class Meta:
        model = CaseClosure
        fields = "__all__"


class CaseClosureWriteSerializer(serializers.ModelSerializer):
    person_id = serializers.SlugRelatedField(source="person", slug_field="person_id", queryset=PERSONS)
    approvals = CaseClosureApprovalWriteSerializer(many=True, required=False)
    class Meta:
        model = CaseClosure
        exclude = SYS + ("person",)

    def validate_approvals(self, approvals):
        seen = set()
        for a in approvals:
            if a.get("role") in seen:
                raise serializers.ValidationError(f"Only one {a.get('role')} approval is allowed.")
            seen.add(a.get("role"))
        return approvals

    @transaction.atomic
    def create(self, validated_data):
        approvals = validated_data.pop("approvals", [])
        obj = CaseClosure.objects.create(**validated_data)
        CaseClosureApproval.objects.bulk_create([CaseClosureApproval(case_closure=obj, **a) for a in approvals])
        return obj

    @transaction.atomic
    def update(self, instance, validated_data):
        approvals = validated_data.pop("approvals", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if approvals is not None:
            instance.approvals.all().delete()
            CaseClosureApproval.objects.bulk_create([CaseClosureApproval(case_closure=instance, **a) for a in approvals])
        return instance


class LogInVictimFullSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    full_name = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    class Meta:
        model = LogInVictims
        fields = (
            "person_id", "full_name", "first_name", "last_name", "middle_name", "other_name",
            "gender", "date_of_birth", "age", "photo",
            "incident_date", "incident_time", "incident_location", "incident_county",
            "phone_number", "email", "county_resident", "district", "address",
            "professional_status", "educational_level", "marital_status", "nationality",
            "type_of_drug_used", "primary_substance_user", "frequency_of_use", "last_used_date",
            "age_first_used", "duration_of_addiction_years", "method_of_use", "dependency_level",
            "overdose_history", "overdose_count", "mental_health_issues",
            "rehab_history", "rehab_details", "arrest_reference", "remarks",
        )

    def get_full_name(self, obj):
        return " ".join(p for p in [obj.first_name, obj.middle_name, obj.last_name, obj.other_name] if p)

    def get_photo(self, obj):
        if not obj.photo:
            return None
        req = self.context.get("request")
        return req.build_absolute_uri(obj.photo.url) if req else obj.photo.url
