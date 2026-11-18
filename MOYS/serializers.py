# MOYS/serializers.py
from rest_framework import serializers
from django.db import transaction

from LDEA.models import LogInVictims
from LDEA.LDEA_serializer import LogInVictimMinimalSerializer

from .models import (
    MYSReferral, ReceiptDisposition, MYSPreTreatmentReintegration,
    ARYEPRegistration, IndividualYouthReintegrationPlan, TVETSkillsTraining,
    MYSYouthIntervention, MYSEmploymentApprenticeshipBusiness,
    MYSFamilyCommunityReintegration, MYSReintegrationFollowUp,
    MYSCaseClosure, MYSServiceProvider
)

# Fields that are never writable from the client.
SYSTEM_FIELDS = (
    "institution", "created_by", "updated_by",
    "created_at", "updated_at", "record_state", "status"
)


# ============================================================
# LDEA Person Serializer (For MOYS)
# ============================================================
class MOYSLogInVictimSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = LogInVictims
        fields = "__all__"

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url


# ============================================================
# 1. MYSReferral
# ============================================================
class MYSReferralReadSerializer(serializers.ModelSerializer):
    persons = LogInVictimMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = MYSReferral
        fields = "__all__"


class MYSReferralWriteSerializer(serializers.ModelSerializer):
     persons = serializers.SlugRelatedField(
          slug_field="person_id", 
          queryset=LogInVictims.objects.all(), 
          many=True, 
          required=False
     )

     class Meta:
          model = MYSReferral
          exclude = SYSTEM_FIELDS


# ============================================================
# 2. ReceiptDisposition
# ============================================================
class ReceiptDispositionReadSerializer(serializers.ModelSerializer):
    persons = LogInVictimMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = ReceiptDisposition
        fields = "__all__"


class ReceiptDispositionWriteSerializer(serializers.ModelSerializer):
    persons = serializers.PrimaryKeyRelatedField(
        queryset=LogInVictims.objects.all(), many=True, required=False
    )

    class Meta:
        model = ReceiptDisposition
        exclude = SYSTEM_FIELDS


# ============================================================
# 3. MYSPreTreatmentReintegration
# ============================================================
class PreTreatmentReintegrationReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSPreTreatmentReintegration
        fields = "__all__"


class PreTreatmentReintegrationWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all()
    )

    class Meta:
        model = MYSPreTreatmentReintegration
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 4. ARYEPRegistration
# ============================================================
class ARYEPRegistrationReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = ARYEPRegistration
        fields = "__all__"


class ARYEPRegistrationWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = ARYEPRegistration
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 5. IndividualYouthReintegrationPlan
# ============================================================
class ReintegrationPlanReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = IndividualYouthReintegrationPlan
        fields = "__all__"


class ReintegrationPlanWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all()
    )

    class Meta:
        model = IndividualYouthReintegrationPlan
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 6. TVETSkillsTraining
# ============================================================
class TVETReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = TVETSkillsTraining
        fields = "__all__"


class TVETWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = TVETSkillsTraining
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 7. MYSYouthIntervention
# ============================================================
class YouthInterventionReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSYouthIntervention
        fields = "__all__"


class YouthInterventionWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MYSYouthIntervention
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 8. MYSEmploymentApprenticeshipBusiness
# ============================================================
class EmploymentBusinessReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSEmploymentApprenticeshipBusiness
        fields = "__all__"


class EmploymentBusinessWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MYSEmploymentApprenticeshipBusiness
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 9. MYSFamilyCommunityReintegration
# ============================================================
class FamilyReintegrationReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSFamilyCommunityReintegration
        fields = "__all__"


class FamilyReintegrationWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MYSFamilyCommunityReintegration
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 10. MYSReintegrationFollowUp
# ============================================================
class FollowUpReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSReintegrationFollowUp
        fields = "__all__"


class FollowUpWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MYSReintegrationFollowUp
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 11. MYSCaseClosure
# ============================================================
class CaseClosureReadSerializer(serializers.ModelSerializer):
    beneficiary = LogInVictimMinimalSerializer(read_only=True)

    class Meta:
        model = MYSCaseClosure
        fields = "__all__"


class CaseClosureWriteSerializer(serializers.ModelSerializer):
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        source="beneficiary", queryset=LogInVictims.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MYSCaseClosure
        exclude = SYSTEM_FIELDS + ("beneficiary",)


# ============================================================
# 12. MYSServiceProvider
# ============================================================
class ServiceProviderReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MYSServiceProvider
        fields = "__all__"


class ServiceProviderWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MYSServiceProvider
        exclude = SYSTEM_FIELDS