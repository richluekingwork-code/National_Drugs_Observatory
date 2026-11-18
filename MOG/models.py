from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import InstitutionScoped
from LDEA.models import LogInVictims


class ChildTrackingRecord(InstitutionScoped):
    """Child Tracking Tool record for the Ministry of Gender."""

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    PROTECTION_STATUS_CHOICES = [
        ("probable", "Probable"),
        ("confirmed", "Confirmed"),
        ("contact", "Contact"),
        ("suspected", "Suspected"),
        ("survivor", "Survivor"),
        ("other", "Other"),
    ]

    PARENT_STATUS_CHOICES = [
        ("living", "Living"),
        ("deceased", "Deceased"),
        ("missing", "Missing"),
        ("unknown", "Unknown"),
    ]

    child_code = models.CharField(max_length=100, unique=True, db_index=True)
    tracking_date = models.DateField(default=timezone.localdate)
    county = models.CharField(max_length=100, db_index=True)

    surname = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True)
    nickname = models.CharField(max_length=255, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    county_of_birth = models.CharField(max_length=100, blank=True)
    county_of_origin = models.CharField(max_length=100, blank=True)
    ethnic_group = models.CharField(max_length=255, blank=True)
    current_address = models.TextField(blank=True)
    district = models.CharField(max_length=255, blank=True)
    community = models.CharField(max_length=255, blank=True)

    protection_status = models.CharField(
        max_length=20,
        choices=PROTECTION_STATUS_CHOICES,
        blank=True,
        db_index=True,
    )
    other_protection_status = models.CharField(max_length=255, blank=True)
    further_information = models.TextField(blank=True)
    immediate_action_required = models.BooleanField(default=False)
    additional_information = models.TextField(blank=True)
    recommended_next_steps = models.TextField(blank=True)
    referral_to_services = models.TextField(blank=True)
    gbv_services = models.BooleanField(default=False)
    health = models.BooleanField(default=False)
    mental_health = models.BooleanField(default=False)
    ftr = models.BooleanField(default=False)
    alternative_care = models.BooleanField(default=False)
    other_referral = models.TextField(blank=True)

    father_name = models.CharField(max_length=255, blank=True)
    father_date_of_birth = models.DateField(null=True, blank=True)
    father_nationality = models.CharField(max_length=255, blank=True)
    father_county_origin = models.CharField(max_length=100, blank=True)
    father_district_origin = models.CharField(max_length=255, blank=True)
    father_status = models.CharField(max_length=20, choices=PARENT_STATUS_CHOICES, blank=True)
    father_address = models.TextField(blank=True)
    father_contact_number = models.CharField(max_length=50, blank=True)

    mother_name = models.CharField(max_length=255, blank=True)
    mother_date_of_birth = models.DateField(null=True, blank=True)
    mother_nationality = models.CharField(max_length=255, blank=True)
    mother_county_origin = models.CharField(max_length=100, blank=True)
    mother_district_origin = models.CharField(max_length=255, blank=True)
    mother_status = models.CharField(max_length=20, choices=PARENT_STATUS_CHOICES, blank=True)
    mother_address = models.TextField(blank=True)
    mother_contact_number = models.CharField(max_length=50, blank=True)

    social_worker_signature = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-tracking_date", "-created_at"]
        indexes = [
            models.Index(fields=["child_code"]),
            models.Index(fields=["institution", "-tracking_date"]),
            models.Index(fields=["county", "protection_status"]),
        ]

    def __str__(self):
        return f"{self.child_code} - {self.first_name} {self.surname}"


# ============================================================
# Choices reused across models
# ============================================================

PARENT_STATUS_CHOICES = [
    ("living",    "Living"),
    ("deceased",  "Deceased"),
    ("missing",   "Missing"),
    ("unknown",   "Unknown"),
]

RELATIONSHIP_CHOICES = [
    ("mother",       "Mother"),
    ("father",       "Father"),
    ("grandparent",  "Grandparent"),
    ("aunt_uncle",   "Aunt / Uncle"),
    ("sibling",      "Sibling"),
    ("cousin",       "Cousin"),
    ("other",        "Other"),
]

CARE_ARRANGEMENT_CHOICES = [
    ("orphanage",             "Orphanage"),
    ("adoption_agency",       "Adoption Agency / Transit Home"),
    ("safe_home",             "Safe Home"),
    ("specialized_home",      "Specialized Home"),
    ("kinship",               "Kinship Care"),
    ("foster",                "Foster Care"),
    ("other",                 "Other"),
]


# ============================================================
# Child / Adult assessment
# ============================================================

class ChildAdultAssessment(InstitutionScoped):
    """Comprehensive initial assessment for a child or adult in need."""

    RISK_LEVEL_CHOICES = [
        ("low",      "Low"),
        ("moderate", "Moderate"),
        ("high",     "High"),
        ("critical", "Critical"),
    ]

    # Eligibility
    case_meets_eligibility = models.BooleanField(default=False)
    consent_assent_completed = models.BooleanField(default=False)

    child_adult_code = models.CharField(max_length=100, blank=True, db_index=True)
    registration_date = models.DateField(null=True, blank=True)
    county = models.CharField(max_length=100, blank=True, db_index=True)

    # Person (from the shared registry)
    person = models.ForeignKey(LogInVictims,on_delete=models.PROTECT,)
    languages_spoken = models.TextField(blank=True)
    special_communication_needs = models.TextField(blank=True)

    # Father
    father_name = models.CharField(max_length=255, blank=True)
    father_date_of_birth = models.DateField(null=True, blank=True)
    father_nationality = models.CharField(max_length=255, blank=True)
    father_county_origin = models.CharField(max_length=255, blank=True)
    father_district_origin = models.CharField(max_length=255, blank=True)
    father_status = models.CharField(max_length=20, choices=PARENT_STATUS_CHOICES, blank=True)
    father_address = models.TextField(blank=True)
    father_contact = models.CharField(max_length=50, blank=True)

    # Mother
    mother_name = models.CharField(max_length=255, blank=True)
    mother_date_of_birth = models.DateField(null=True, blank=True)
    mother_nationality = models.CharField(max_length=255, blank=True)
    mother_county_origin = models.CharField(max_length=255, blank=True)
    mother_district_origin = models.CharField(max_length=255, blank=True)
    mother_status = models.CharField(max_length=20, choices=PARENT_STATUS_CHOICES, blank=True)
    mother_address = models.TextField(blank=True)
    mother_contact = models.CharField(max_length=50, blank=True)

    # Current care arrangement
    care_arrangement = models.CharField(max_length=40, choices=CARE_ARRANGEMENT_CHOICES, blank=True)
    care_full_names = models.CharField(max_length=255, blank=True)
    care_date_birth = models.DateField(null=True, blank=True)
    care_nationality = models.CharField(max_length=255, blank=True)
    care_town_of_origin = models.CharField(max_length=255, blank=True)  # renamed from town_of_origin
    care_gender = models.CharField(max_length=20, blank=True)
    care_current_address = models.TextField(blank=True)  # was misspelled "cear_"
    care_contact_number = models.CharField(max_length=50, blank=True)

    # Protection concerns
    protection_concerns = models.TextField(blank=True)
    physical_disability = models.TextField(blank=True)
    mental_illness = models.TextField(blank=True)
    substances_abuse = models.TextField(blank=True)

    # Risk
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, blank=True, db_index=True)
    risk_summary = models.TextField(blank=True)

    # Immediate concerns
    immediate_concern = models.CharField(max_length=255, blank=True)
    immediate_reason = models.TextField(blank=True)
    immediate_action_taken = models.TextField(blank=True)

    # Case history
    case_history = models.TextField(blank=True)
    recommended_next_steps = models.TextField(blank=True)
    first_documented = models.TextField(blank=True)
    location_status = models.TextField(blank=True)

    # Follow-up
    next_up_date = models.DateTimeField(null=True, blank=True)
    reporting_agency = models.CharField(max_length=255, blank=True)

    # Staff
    professional_name = models.CharField(max_length=255, blank=True)
    professional_cell = models.CharField(max_length=50, blank=True)
    supervisor_name = models.CharField(max_length=255, blank=True)
    supervisor_cell = models.CharField(max_length=50, blank=True)
    social_worker_signature = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["person", "-created_at"]),
            models.Index(fields=["risk_level", "county"]),
            models.Index(fields=["institution", "-created_at"]),
        ]

    def __str__(self):
        return f"Assessment — {self.person}"


# ============================================================
# Follow-up visits
# ============================================================

class FollowUpVisit(InstitutionScoped):
    """Periodic follow-up visit on an existing case."""

    person = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name="mog_followups",)
    child_code = models.CharField(max_length=100, blank=True, db_index=True)
    visit_county = models.CharField(max_length=100, blank=True)

    # Location
    location_house = models.CharField(max_length=255, blank=True)
    street = models.CharField(max_length=255, blank=True)
    town = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=255, blank=True)
    county = models.CharField(max_length=255, blank=True, db_index=True)
    country = models.CharField(max_length=255, blank=True)

    caregiver_name = models.CharField(max_length=255, blank=True)
    caregiver_relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)
    contact_number = models.CharField(max_length=50, blank=True)

    # Visit metadata
    visit_date = models.DateField(null=True, blank=True, db_index=True)
    visit_number = models.PositiveIntegerField(null=True, blank=True)
    child_seen = models.BooleanField(default=False)
    seen_alone = models.BooleanField(default=False)

    # Details
    followup_date = models.DateField(null=True, blank=True)
    previous_followup_date = models.DateField(null=True, blank=True)
    followed_with = models.JSONField(default=list, blank=True)
    followed_through = models.JSONField(default=list, blank=True)
    action_followed = models.BooleanField(default=False)
    action_service = models.TextField(blank=True)
    purpose_of_followup = models.TextField(blank=True)
    followup_details = models.TextField(blank=True)
    action_conducted = models.CharField(max_length=20, blank=True)
    situation_change = models.CharField(max_length=20, blank=True)

    # Psychological
    appearance = models.CharField(max_length=50, blank=True)
    psychological_notes = models.TextField(blank=True)

    # Physical health
    health_status = models.CharField(max_length=50, blank=True)
    health_notes = models.TextField(blank=True)
    frequently_sick = models.BooleanField(default=False)

    # Protection
    protection_issues = models.TextField(blank=True)

    # Caseworker
    caseworker_name = models.CharField(max_length=255, blank=True)
    agency = models.CharField(max_length=255, blank=True)
    signature = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-visit_date", "-created_at"]
        indexes = [
            models.Index(fields=["person", "-visit_date"]),
            models.Index(fields=["institution", "-visit_date"]),
        ]

    def __str__(self):
        return f"Follow-up #{self.visit_number or '?'} — {self.person}"


# ============================================================
# Family tracing
# ============================================================

class FamilyTracingVerification(InstitutionScoped):
    """Family tracing investigation for a separated child."""

    CENTER_CHOICES = [
        ("orphanage",         "Orphanage"),
        ("adoption_agency",   "Adoption Agency / Transit Home"),
        ("safe_home",         "Safe Home"),
        ("specialized_home",  "Specialized Home"),
        ("other",             "Other"),
    ]

    person = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name="mog_tracing",)
    child_code = models.CharField(max_length=100, blank=True, db_index=True)
    follow_county = models.CharField(max_length=100, blank=True)
    center_type = models.CharField(max_length=40, choices=CENTER_CHOICES, blank=True)
    center_type_other = models.CharField(max_length=255, blank=True)
    separated_child = models.BooleanField(default=False)

    # Family history
    mother_name = models.CharField(max_length=255, blank=True)
    mother_alive = models.BooleanField(null=True, blank=True)
    father_name = models.CharField(max_length=255, blank=True)
    father_alive = models.BooleanField(null=True, blank=True)
    guardian_alive = models.BooleanField(null=True, blank=True)
    parent_status = models.CharField(max_length=100, blank=True)

    # Before separation
    house_location = models.TextField(blank=True)
    street = models.CharField(max_length=255, blank=True)
    town = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=255, blank=True)
    county = models.CharField(max_length=255, blank=True, db_index=True)
    country = models.CharField(max_length=255, blank=True)
    address_information = models.TextField(blank=True)
    child_life_information = models.TextField(blank=True)
    child_memorable_events = models.TextField(blank=True)

    # Evidence
    child_id_evidence = models.BooleanField(default=False)
    birth_certificate_evidence = models.BooleanField(default=False)
    photos_evidence = models.BooleanField(default=False)
    other_evidence = models.CharField(max_length=255, blank=True)
    child_identification_information = models.TextField(blank=True)

    # Separation
    separation_date = models.DateField(null=True, blank=True)
    separation_address = models.TextField(blank=True)
    separated_from_name = models.CharField(max_length=255, blank=True)
    relationship_to_child = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)
    separation_circumstances = models.TextField(blank=True)
    main_cause_of_separation = models.TextField(blank=True)

    # Traced family
    traced_person_name = models.CharField(max_length=255, blank=True)
    traced_person_age = models.PositiveIntegerField(null=True, blank=True)
    traced_person_contact = models.CharField(max_length=100, blank=True)
    traced_person_gender = models.CharField(max_length=20, blank=True)
    traced_person_relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)
    traced_person_occupation = models.CharField(max_length=255, blank=True)

    # Acceptance
    wants_child = models.BooleanField(null=True, blank=True)
    able_to_take_care = models.BooleanField(null=True, blank=True)
    alternative_family_available = models.BooleanField(null=True, blank=True)
    agreement_take_child = models.BooleanField(default=False)
    signature_name = models.CharField(max_length=255, blank=True)

    # Observations
    child_return_information = models.TextField(blank=True)
    caseworker_observation = models.TextField(blank=True)
    caseworker_name = models.CharField(max_length=255, blank=True)
    caseworker_date = models.DateField(null=True, blank=True)
    organization = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["person", "-created_at"]),
            models.Index(fields=["institution", "-created_at"]),
        ]

    def __str__(self):
        return f"Tracing — {self.child_code or self.pk}"


class FamilyMember(models.Model):
    """A family member listed during a tracing investigation."""

    tracing = models.ForeignKey(FamilyTracingVerification, on_delete=models.CASCADE, related_name="family_members",)
    name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.relationship})"


# ============================================================
# Beneficiary verification & handover
# ============================================================

class BeneficiaryVerification(InstitutionScoped):
    """Pre-reunification verification of a beneficiary."""

    child_code = models.CharField(max_length=100, blank=True, db_index=True)
    case_id_number = models.CharField(max_length=100, blank=True)
    follow_county = models.CharField(max_length=100, blank=True)
    date_completed = models.DateField(null=True, blank=True)

    person = models.ForeignKey(
        LogInVictims,
        on_delete=models.PROTECT,
        related_name="mog_verifications",
    )

    current_address = models.TextField(blank=True)
    caregiver_name = models.CharField(max_length=255, blank=True)

    before_separation_address = models.TextField(blank=True)
    street = models.CharField(max_length=255, blank=True)
    town = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=255, blank=True)
    county = models.CharField(max_length=255, blank=True, db_index=True)
    country = models.CharField(max_length=255, blank=True)
    other_address_info = models.CharField(max_length=255, blank=True)

    # Verification
    match_case = models.BooleanField(null=True, blank=True)
    discrepancies = models.TextField(blank=True)
    child_knows_adult = models.BooleanField(null=True, blank=True)
    child_comments = models.TextField(blank=True)
    recognize_photos = models.BooleanField(null=True, blank=True)

    # Wishes
    need_info = models.BooleanField(null=True, blank=True)
    info_provided = models.BooleanField(null=True, blank=True)
    wants_reunification = models.BooleanField(null=True, blank=True)
    child_wishes_comments = models.TextField(blank=True)

    # Recommendation
    recommendation = models.CharField(max_length=255, blank=True)
    recommendation_reason = models.TextField(blank=True)

    caseworker_name = models.CharField(max_length=255, blank=True)
    caseworker_date = models.DateField(null=True, blank=True)
    organization = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["person", "-created_at"])]

    def __str__(self):
        return f"Verification — {self.child_code or self.pk}"


class BeneficiaryHandover(InstitutionScoped):
    """Formal handover of a child to a receiving caregiver."""

    person = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name="mog_handovers",)
    follow_county = models.CharField(max_length=100, blank=True)

    reunification_type = models.CharField(max_length=100)
    adult_verification = models.BooleanField(default=False)
    child_verification = models.BooleanField(default=False)
    relationship_verified = models.BooleanField(default=False)
    ongoing_support_needed = models.BooleanField(default=False)

    caseworker_name = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)

    caregiver1_name = models.CharField(max_length=255)
    caregiver1_sex = models.CharField(max_length=20, blank=True)
    caregiver1_relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)
    caregiver2_name = models.CharField(max_length=255, blank=True)
    caregiver2_sex = models.CharField(max_length=20, blank=True)
    caregiver2_relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)

    address = models.TextField()
    phone = models.CharField(max_length=50, blank=True)
    town_village = models.CharField(max_length=255, blank=True)
    clan = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=255, blank=True)
    county = models.CharField(max_length=255, blank=True, db_index=True)
    country = models.CharField(max_length=255, blank=True)

    reunification_date = models.DateField()
    reunification_place = models.CharField(max_length=255)

    consent_person = models.CharField(max_length=255, blank=True)
    child_name = models.CharField(max_length=255, blank=True)
    agreement_statement = models.TextField(blank=True)

    caseworker_signature = models.CharField(max_length=255, blank=True)
    receiver_signature = models.CharField(max_length=255, blank=True)
    witness_signature = models.CharField(max_length=255, blank=True)

    additional_information = models.TextField(blank=True)
    new_address_location = models.TextField(blank=True)
    signature_date = models.DateField(null=True, blank=True)
    signature_place = models.CharField(max_length=255, blank=True)
    siblings_reunified = models.TextField(blank=True)

    supervisor_name = models.CharField(max_length=255, blank=True)
    supervisor_position = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-reunification_date"]
        indexes = [models.Index(fields=["person", "-reunification_date"])]

    def __str__(self):
        return f"Handover — {self.person}"


# ============================================================
# Tracing actions
# ============================================================

class TracingActionTaken(InstitutionScoped):
    """A block of tracing actions performed on a case."""

    follow_county = models.CharField(max_length=100, blank=True)
    person = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name="mog_tracing_actions",)
    tracing_notes = models.TextField()
    caseworker_name = models.CharField(max_length=255)
    caseworker_date = models.DateField()
    caseworker_signature = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-caseworker_date"]
        indexes = [models.Index(fields=["person", "-caseworker_date"])]

    def __str__(self):
        return f"Tracing actions — {self.person}"


class TracingActionDetail(models.Model): # type: ignore
    """Individual action within a tracing block."""

    tracing_record = models.ForeignKey(TracingActionTaken, on_delete=models.CASCADE, related_name="actions",)
    action_taken = models.CharField(max_length=255, blank=True)
    provider_details = models.CharField(max_length=255, blank=True)
    individual_traced = models.CharField(max_length=255, blank=True)
    tracing_location = models.TextField(blank=True)
    tracing_outcome = models.CharField(max_length=100, blank=True)
    tracing_details = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["pk"]

    def __str__(self):
        return self.action_taken or f"Action #{self.pk}"


# ============================================================
# Community outreach
# ============================================================

class CommunityOutreachReport(InstitutionScoped):
    """A community outreach activity and its follow-up."""

    follow_county = models.CharField(max_length=100, blank=True)
    reporting_date = models.DateField()
    reporting_period = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    county_district_community = models.CharField(max_length=255)
    outreach_officer = models.CharField(max_length=255)
    contact_information = models.CharField(max_length=255)

    activity_date = models.DateField(null=True, blank=True, db_index=True)
    community_location = models.CharField(max_length=255, blank=True)
    activity_type = models.CharField(max_length=255, blank=True)
    target_group = models.CharField(max_length=255, blank=True)
    number_reached = models.PositiveIntegerField(null=True, blank=True)
    key_issues_identified = models.TextField(blank=True)
    topics_discussed = models.TextField(blank=True)
    community_concerns = models.TextField(blank=True)

    person = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name="mog_outreach",)
    risk_factors = models.TextField(blank=True)
    immediate_needs = models.TextField(blank=True)

    followup_details = models.TextField(blank=True)
    followup_type = models.CharField(max_length=255, blank=True)
    progress_observed = models.TextField(blank=True)
    challenges_identified = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    next_followup_date = models.DateField(null=True, blank=True)

    emotional_condition = models.TextField(blank=True)
    family_support_status = models.TextField(blank=True)
    school_attendance = models.TextField(blank=True)
    behavioral_improvement = models.TextField(blank=True)
    additional_support_needed = models.TextField(blank=True)

    # Referral
    referral_date = models.DateField(null=True, blank=True)
    referred_by = models.CharField(max_length=255, blank=True)
    receiving_institution = models.CharField(max_length=255, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_number = models.CharField(max_length=50, blank=True)
    reason_for_referral = models.TextField(blank=True)
    services_accessed = models.TextField(blank=True)
    feedback_from_provider = models.TextField(blank=True)
    outcome = models.TextField(blank=True)
    followup_needed = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)

    # Assessment details
    institution_name = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    assessment_datetime = models.DateTimeField(null=True, blank=True)
    interviewee_name = models.CharField(max_length=255, blank=True)
    interviewee_position = models.CharField(max_length=255, blank=True)
    interviewee_contact = models.CharField(max_length=50, blank=True)

    class Meta: # type: ignore
        ordering = ["-reporting_date"]
        indexes = [
            models.Index(fields=["institution", "-reporting_date"]),
            models.Index(fields=["person", "-reporting_date"]),
        ]

    def __str__(self):
        return f"Outreach — {self.reporting_date}"


# ============================================================
# Case closure
# ============================================================

class CaseClosure(InstitutionScoped):
    """Final closure record for a case."""

    STORAGE_CHOICES = [
        ("electronic", "Electronic"),
        ("hardcopy",   "Hard Copy"),
        ("both",       "Both"),
    ]

    person = models.ForeignKey(
        LogInVictims,
        on_delete=models.PROTECT,
        related_name="mog_case_closures",
    )
    follow_county = models.CharField(max_length=100, blank=True)
    case_id_number = models.CharField(max_length=100)
    date_case_closed = models.DateField()
    primary_reason = models.CharField(max_length=255)
    closure_reason_details = models.TextField(blank=True)
    case_opened_weeks = models.PositiveIntegerField(null=True, blank=True)
    current_case_summary = models.TextField()
    caregiver_name = models.CharField(max_length=255, blank=True)
    caregiver_relationship = models.CharField(max_length=100, choices=RELATIONSHIP_CHOICES, blank=True)
    county = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    community = models.CharField(max_length=255, blank=True)
    street = models.CharField(max_length=255, blank=True)
    caregiver_phone = models.CharField(max_length=100, blank=True)
    closure_process = models.TextField()
    child_agreed = models.BooleanField(default=False)
    child_reason = models.TextField(blank=True)
    caregiver_agreed = models.BooleanField(default=False)
    caregiver_reason = models.TextField(blank=True)
    followup_planned = models.BooleanField(default=False)
    followup_reason = models.TextField(blank=True)
    file_complete = models.BooleanField(default=False)
    file_complete_reason = models.TextField(blank=True)
    storage_method = models.CharField(max_length=20, choices=STORAGE_CHOICES, default="electronic")
    file_storage_until = models.DateField(null=True, blank=True)
    child_informed = models.BooleanField(default=False)
    child_informed_reason = models.TextField(blank=True)
    contact_person_details = models.TextField(blank=True)
    caseworker_name = models.CharField(max_length=255)
    caseworker_phone = models.CharField(max_length=100, blank=True)
    caseworker_signature = models.CharField(max_length=255, blank=True)

    class Meta: # type: ignore
        ordering = ["-date_case_closed"]
        indexes = [
            models.Index(fields=["person", "-date_case_closed"]),
            models.Index(fields=["institution", "-date_case_closed"]),
        ]

    def __str__(self):
        return f"Closure — {self.person}"


class CaseClosureApproval(models.Model):
    """Individual approval attached to a case closure."""

    ROLE_CHOICES = [
        ("child",      "Child"),
        ("caregiver",  "Caregiver"),
        ("caseworker", "Caseworker"),
        ("supervisor", "Supervisor"),
    ]

    case_closure = models.ForeignKey(
        CaseClosure,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    name = models.CharField(max_length=255)
    agency = models.CharField(max_length=255, blank=True)
    contact_details = models.CharField(max_length=255, blank=True)
    signature = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["role"]
        constraints = [
            models.UniqueConstraint(
                fields=["case_closure", "role"],
                name="unique_approval_role_per_closure",
            ),
        ]

    def __str__(self):
        return f"{self.role} — {self.name}"