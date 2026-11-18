"""MOH (Ministry of Health) — demand reduction, prevention, and treatment facilities.

Demand reduction records link to one or more persons via M2M because a
single treatment episode can cover a group session or family unit.
Prevention records are institution-level reports. Treatment facilities
are shared reference data used by the referral workflow.
"""

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import BaseModel, InstitutionScoped
from LDEA.models import LogInVictims


# ============================================================
# Shared choices
# ============================================================

INJECTION_SUBSTANCE_CHOICES = [
    ("yes",     "Yes"),
    ("no",      "No"),
    ("unknown", "Unknown"),
]

ROUTE_CHOICES = [
    ("oral",       "Oral"),
    ("injection",  "Injection"),
    ("smoking",    "Smoking / Inhalation"),
    ("snorting",   "Snorting"),
    ("other",      "Other"),
]

ADMISSION_STATUS_CHOICES = [
    ("admitted",   "Admitted"),
    ("waitlisted", "Waitlisted"),
    ("referred",   "Referred"),
    ("declined",   "Declined"),
    ("completed",  "Completed"),
]

# ============================================================
# Demand reduction
# ============================================================
class DemandReduction(InstitutionScoped):
    """
    Demand-reduction intervention record.

    Covers treatment, harm-reduction referrals, and clinical
    interventions for one or more persons. The M2M to Person is
    intentional: a group session or family episode can cover multiple
    people at once, and each record is the full intervention, not a
    single-person event.
    """
    REFERRAL_STATUS_NONE = "none"
    REFERRAL_STATUS_PENDING = "pending"
    REFERRAL_STATUS_ACCEPTED = "accepted"
    REFERRAL_STATUS_DECLINED = "declined"
    REFERRAL_STATUS_IN_TRANSIT = "in_transit"
    REFERRAL_STATUS_COMPLETED = "completed"

    REFERRAL_STATUS_CHOICES = [
        (REFERRAL_STATUS_NONE, "No referral"),
        (REFERRAL_STATUS_PENDING, "Pending"),
        (REFERRAL_STATUS_ACCEPTED, "Accepted"),
        (REFERRAL_STATUS_DECLINED, "Declined"),
        (REFERRAL_STATUS_IN_TRANSIT, "In transit"),
        (REFERRAL_STATUS_COMPLETED, "Completed"),
    ]

    persons = models.ManyToManyField(LogInVictims, related_name="moh_demand_reductions", blank=True,)

    # Treatment
    treatment = models.TextField(blank=True)
    treatment_facility = models.CharField(max_length=255, blank=True)
    type_of_treatment = models.CharField(max_length=255, blank=True)

    cases = models.CharField(max_length=100, blank=True)
    injection_substance = models.CharField(max_length=10, choices=INJECTION_SUBSTANCE_CHOICES, blank=True,)
    drug_test = models.TextField(blank=True)

    # Location
    county = models.CharField(max_length=50, blank=True, db_index=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=50, blank=True)

    # Clinical
    psychotherapeutic_intervention = models.CharField(max_length=255, blank=True)
    psychotropic_interventions = models.CharField(max_length=255, blank=True)
    comorbid_conditions = models.CharField(max_length=255, blank=True)
    route_of_administration = models.CharField(max_length=20, choices=ROUTE_CHOICES, blank=True,)

    # Referral
    receiving_facility = models.ForeignKey("TreatmentFacility", on_delete=models.SET_NULL, null=True, blank=True, related_name="incoming_referrals",)
    referral_status = models.CharField(max_length=20, choices=REFERRAL_STATUS_CHOICES, default=REFERRAL_STATUS_NONE, db_index=True,)
    refer_from = models.CharField(max_length=255, blank=True)
    refer_to = models.CharField(max_length=255, blank=True)
    referred_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    admission_status = models.CharField(max_length=20, choices=ADMISSION_STATUS_CHOICES, blank=True, db_index=True,)
    class Meta: # type: ignore
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["institution", "-created_at"]),
            models.Index(fields=["county", "admission_status"]),
            models.Index(fields=["referral_status", "-referred_at"]),
            models.Index(fields=["receiving_facility", "referral_status"]),
        ]
        verbose_name = "Demand reduction record"
        verbose_name_plural = "Demand reduction records"

    def __str__(self):
        return f"Demand reduction #{self.pk}"

# ============================================================
# Prevention
# ============================================================
class Prevention(InstitutionScoped):
    """
    Institution-level prevention activity report.

    Records which prevention activities an institution conducted in a
    reporting period, along with a free-text summary of each. This is
    a checklist-style report, not a per-person intervention.
    """

    # Institution profile (recorded at report time, may differ from
    # the caller's institution if the report is a partner submission).
    institution_name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    date = models.DateField(db_index=True)

    district = models.CharField(max_length=100, blank=True)
    county = models.CharField(max_length=100, blank=True, db_index=True)

    # Activities
    sud_awareness = models.BooleanField(default=False)
    sud_communities = models.TextField(blank=True, help_text="Community names separated by comma.",)

    school_health_club = models.BooleanField(default=False)
    school_names = models.TextField(blank=True, help_text="School names separated by comma.",)

    media_campaign = models.BooleanField(default=False)
    media_details = models.TextField(blank=True)

    harm_reduction = models.BooleanField(default=False)
    harm_reduction_details = models.TextField(blank=True)

    radio_talk_show = models.BooleanField(default=False)
    radio_details = models.TextField(blank=True)

    class Meta: # type: ignore
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["institution", "-date"]),
            models.Index(fields=["county", "-date"]),
        ]

    def __str__(self):
        return f"{self.institution_name} — {self.date}"

# ============================================================
# Treatment facility
# ============================================================
class TreatmentFacility(InstitutionScoped):
    """
    A treatment facility in the observatory network.

    This is shared reference data: facilities appear in referral
    dropdowns across MOH and MOG workflows. Facilities carry rich
    metadata (capacity, services, staffing) used for capacity planning.
    """

    FACILITY_TYPES = [
        ("inpatient",  "Inpatient Rehabilitation Center"),
        ("outpatient", "Outpatient Treatment Center"),
        ("detox",      "Detoxification Center"),
        ("community",  "Community-Based Treatment Center"),
        ("hospital",   "Hospital-Based Treatment Unit"),
        ("private",    "Private Treatment Facility"),
        ("government", "Government Treatment Facility"),
    ]

    OWNERSHIP_TYPES = [
        ("government",  "Government"),
        ("private",     "Private"),
        ("ngo",         "NGO"),
        ("faith_based", "Faith-Based Organization"),
    ]

    OPERATIONAL_STATUS = [
        ("active",    "Active"),
        ("inactive",  "Inactive"),
        ("suspended", "Suspended"),
        ("closed",    "Closed"),
    ]

    # Profile
    facility_name = models.CharField(max_length=255)
    facility_code = models.CharField(max_length=50, unique=True, blank=True)
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPES)
    ownership_type = models.CharField(max_length=20, choices=OWNERSHIP_TYPES)

    # Location
    county = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, blank=True)
    city_town = models.CharField(max_length=100, blank=True)
    physical_address = models.TextField(blank=True)

    # Contact
    contact_person = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    alternate_phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Licensing
    licensed = models.BooleanField(default=False)
    license_number = models.CharField(max_length=100, blank=True)
    license_issue_date = models.DateField(null=True, blank=True)
    license_expiry_date = models.DateField(null=True, blank=True)

    # Capacity
    total_beds = models.PositiveIntegerField(default=0)
    male_beds = models.PositiveIntegerField(default=0)
    female_beds = models.PositiveIntegerField(default=0)
    adolescent_beds = models.PositiveIntegerField(default=0)
    current_occupancy = models.PositiveIntegerField(default=0)

    # Services
    detoxification_services = models.BooleanField(default=False)
    inpatient_services = models.BooleanField(default=False)
    outpatient_services = models.BooleanField(default=False)
    counseling_services = models.BooleanField(default=False)
    family_therapy = models.BooleanField(default=False)
    group_therapy = models.BooleanField(default=False)
    medication_assisted_treatment = models.BooleanField(default=False)
    mental_health_services = models.BooleanField(default=False)
    vocational_training = models.BooleanField(default=False)
    aftercare_services = models.BooleanField(default=False)

    # Staffing
    medical_doctors = models.PositiveIntegerField(default=0)
    psychiatrists = models.PositiveIntegerField(default=0)
    psychologists = models.PositiveIntegerField(default=0)
    nurses = models.PositiveIntegerField(default=0)
    counselors = models.PositiveIntegerField(default=0)
    social_workers = models.PositiveIntegerField(default=0)
    peer_support_workers = models.PositiveIntegerField(default=0)

    # Operations
    operational_status = models.CharField(max_length=20, choices=OPERATIONAL_STATUS, default="active", db_index=True,)
    opening_hours = models.CharField(max_length=255, blank=True)
    accepts_referrals = models.BooleanField(default=True)
    emergency_services_available = models.BooleanField(default=False)

    # Reporting
    reporting_year = models.PositiveIntegerField(db_index=True)
    reporting_quarter = models.CharField(max_length=20, blank=True)
    remarks = models.TextField(blank=True)

    class Meta: # type: ignore
        ordering = ["facility_name"]
        verbose_name = "Treatment facility"
        verbose_name_plural = "Treatment facilities"
        indexes = [
            models.Index(fields=["county", "facility_type"]),
            models.Index(fields=["operational_status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["facility_name", "county"],
                name="unique_facility_name_per_county",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.facility_code:
            year = timezone.now().year
            county_slug = "".join(
                c for c in (self.county or "GEN").upper() if c.isalnum()
            )[:4]
            self.facility_code = (
                f"MOH-{county_slug}-{year}-"
                f"{TreatmentFacility.objects.count() + 1:04d}"
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.facility_name} ({self.county})"