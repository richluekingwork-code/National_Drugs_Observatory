
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from core.models import InstitutionScoped

User = settings.AUTH_USER_MODEL


# ============================================================
# Log in Victims
# ============================================================
class LogInVictims(InstitutionScoped):
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other"),]
    MARITAL_STATUS_CHOICES = [("single", "Single"), ("married", "Married"), ("divorced", "Divorced"), ("separated", "Separated"), ("widowed", "Widowed"), ("other", "Other"),]

    DEPENDENCY_LEVEL = [("low", "Low"), ("moderate", "Moderate"), ("high", "High"),]
    FREQUENCY_CHOICES = [("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly"), ("occasional", "Occasional"),]
    METHOD_CHOICES = [("smoking", "Smoking"), ("injecting", "Injecting"), ("oral", "Oral"), ("snorting", "Snorting"), ("inhaling", "Inhaling"), ("other", "Other"),]


    person_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)

    incident_date = models.DateField(db_index=True)
    incident_time = models.TimeField(null=True, blank=True)
    incident_location = models.CharField(max_length=255)
    incident_county = models.CharField(max_length=50, blank=True, db_index=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    other_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)

    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    county_resident = models.CharField(max_length=50, blank=True, db_index=True)
    district = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)

    professional_status = models.CharField(max_length=100, blank=True)
    educational_level = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    nationality = models.CharField(max_length=100, default="Liberian")

    type_of_drug_used = models.TextField(blank=True)
    primary_substance_user = models.CharField(max_length=255, blank=True)
    frequency_of_use = models.CharField(max_length=50, choices=FREQUENCY_CHOICES, blank=True)
    last_used_date = models.DateField(null=True, blank=True)
    age_first_used = models.PositiveSmallIntegerField(null=True, blank=True)
    duration_of_addiction_years = models.PositiveIntegerField(null=True, blank=True)
    method_of_use = models.CharField(max_length=50, choices=METHOD_CHOICES, blank=True)
    dependency_level = models.CharField(max_length=20, choices=DEPENDENCY_LEVEL, blank=True)

    overdose_history = models.BooleanField(default=False)
    overdose_count = models.PositiveIntegerField(null=True, blank=True)
    mental_health_issues = models.BooleanField(default=False)
    rehab_history = models.BooleanField(default=False)
    rehab_details = models.TextField(blank=True)
    arrest_reference = models.CharField(max_length=100, blank=True)

    remarks = models.TextField(blank=True)
    photo = models.ImageField(upload_to="persons/", null=True, blank=True)

    class Meta:  # type: ignore
        ordering = ["-created_at"]
        verbose_name = "Log-in Victim"
        verbose_name_plural = "Log-in Victims"
        indexes = [
            models.Index(fields=["county_resident"]),
            models.Index(fields=["incident_county"]),
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["incident_date"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = timezone.localdate()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))  

# ============================================================
# Create Arrests
# ============================================================
class Create_Arrests(InstitutionScoped):
    STATUS_DETAINED = "detained"
    STATUS_RELEASED = "released"
    STATUS_TRANSFERRED = "transferred"    
    ARREST_STATUS = [(STATUS_DETAINED, "Detained"), (STATUS_RELEASED, "Released"), (STATUS_TRANSFERRED, "Transferred to Court"),]
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other"),]
    MARITAL_STATUS_CHOICES = [("single", "Single"), ("married", "Married"), ("divorced", "Divorced"), ("separated", "Separated"), ("widowed", "Widowed"), ("other", "Other"),]
    
    arrest_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True,)
    arrests_number = models.CharField(max_length=50, blank=False, unique=True)
    arrest_date = models.DateField(db_index=True)
    arrest_time = models.TimeField(null=True, blank=True)
    county_of_arrests = models.CharField(max_length=50, blank=True, db_index=True)
    district_of_arrests = models.CharField(max_length=50, blank=True)
    location_of_arrests = models.TextField(blank=True)    
    
    # Presonal Info        
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    other_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to="arrests/", null=True, blank=True)    
    # age = models.PositiveSmallIntegerField(null=True, blank=True)
     
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    county = models.CharField(max_length=50, blank=True, db_index=True)
    district = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    
    professional_status = models.CharField(max_length=100, blank=True)
    educational_level = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True,)
    nationality = models.CharField(max_length=100, default="Liberian")
    
    drug_type = models.CharField(max_length=100, blank=True)
    quantity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0)],)
    unit = models.CharField(max_length=50, blank=True)
    charges = models.TextField(blank=True)
    
    arresting_officer = models.CharField(max_length=255)
    badge_number = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=50, choices=ARREST_STATUS, default=STATUS_DETAINED, db_index=True,)
    remarks = models.TextField(blank=True)


    class Meta: # type: ignore
        ordering = ["-created_at"]
        verbose_name = "Arrest"
        verbose_name_plural = "Arrests"
        indexes = [
            models.Index(fields=["county"]),
            models.Index(fields=["last_name", "first_name"]),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = timezone.localdate()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
# ============================================================
# Reference data
# ============================================================
class DrugType(models.Model):
    """Global reference list. Shared across all institutions."""

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    common_units = models.CharField(max_length=50, blank=True)
    slug = models.SlugField(unique=True, blank=True)
    photo = models.ImageField(upload_to="drug_types/", null=True, blank=True,)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="drug_types_added",)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# ============================================================
# Drug raids
# ============================================================
class DrugRaid(InstitutionScoped):
    STATUS_PLANNED = "planned"
    STATUS_ONGOING = "ongoing"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PLANNED, "Planned"),
        (STATUS_ONGOING, "Ongoing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    reference_code = models.CharField(max_length=100, unique=True, blank=True,)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True)
    county = models.CharField(max_length=50, blank=True, db_index=True)
    raid_date = models.DateField(db_index=True)
    raid_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PLANNED, db_index=True,)
    lead_officer = models.CharField(max_length=50, blank=True, db_index=True)
    team_members = models.CharField(max_length=50, blank=True, db_index=True)
    total_arrests = models.PositiveIntegerField(default=0)
    total_seizures = models.PositiveIntegerField(default=0)

    class Meta: # type: ignore
        ordering = ["-raid_date"]
        indexes = [models.Index(fields=["status", "county"])]

    def save(self, *args, **kwargs):
        if not self.reference_code:
            year = timezone.now().year
            self.reference_code = (
                f"LDEA-{year}-{uuid.uuid4().hex[:6].upper()}"
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} — {self.location}"

# ============================================================
# Seizures
# ============================================================
class Seizure(InstitutionScoped):
    STATUS_STORED = "stored"
    STATUS_DESTROYED = "destroyed"
    STATUS_ANALYSIS = "used_for_analysis"
    STATUS_TRANSFERRED = "transferred"

    SEIZURE_STATUS = [
        (STATUS_STORED, "Stored in Evidence Room"),
        (STATUS_DESTROYED, "Destroyed"),
        (STATUS_ANALYSIS, "Used for Analysis"),
        (STATUS_TRANSFERRED, "Transferred to Court"),
    ]

    seizure_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True,)
    seizure_date = models.DateField(db_index=True)
    seizure_time = models.TimeField(null=True, blank=True)
    county = models.CharField(max_length=50, blank=True, db_index=True)
    district = models.CharField(max_length=50, blank=True)
    location_description = models.TextField(blank=True)
    seized_by = models.CharField(max_length=255)
    badge_number = models.CharField(max_length=100, blank=True)
    drug_type = models.CharField(max_length=100, blank=True)
    quantity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0)],)
    unit = models.CharField(max_length=50, blank=True)
    photo = models.ImageField(upload_to="seizures/", null=True, blank=True,)
    status = models.CharField(max_length=50, choices=SEIZURE_STATUS, default=STATUS_STORED, db_index=True,)
    remarks = models.TextField(blank=True)

    slug = models.SlugField(unique=True, blank=True)

    class Meta: # type: ignore
        ordering = ["-seizure_date"]
        verbose_name = "Seizure"
        verbose_name_plural = "Seizures"
        indexes = [
            models.Index(fields=["status", "county"]),
            models.Index(fields=["seizure_date"]),
        ]

    def _build_slug(self) -> str:
        label = slugify((self.drug_type or "").strip())[:60] or "seizure"
        return f"{label}-{self.seizure_id.hex}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._build_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Seizure {self.seizure_id} — {self.drug_type or 'unspecified'}"

# ============================================================
# Cases
# ============================================================
class Cases(InstitutionScoped):
    STATUS_PENDING = "pending"
    STATUS_INVESTIGATION = "investigation"
    STATUS_CLOSED = "closed"

    CASE_STATUS = [
        (STATUS_PENDING, "Case pending at MOJ"),
        (STATUS_INVESTIGATION, "Under Investigation"),
        (STATUS_CLOSED, "Closed"),
    ]

    case_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True,)
    case_number = models.CharField(max_length=100, unique=True)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    filing_date = models.DateField(auto_now_add=True)
    court_name = models.CharField(max_length=255, blank=True)

    county = models.CharField(max_length=50, blank=True, db_index=True)

    substance = models.CharField(max_length=255, blank=True)
    action_taken = models.CharField(max_length=255, blank=True)
    charge = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=50, choices=CASE_STATUS, default=STATUS_PENDING, db_index=True,)
    slug = models.SlugField(unique=True, blank=True)

    class Meta: # type: ignore
        ordering = ["-filing_date"]
        verbose_name_plural = "Cases"
        indexes = [models.Index(fields=["status"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.case_number}-{self.case_id}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Case {self.case_number} — {self.title}"

class CaseParticipant(models.Model):
    ROLE_SUSPECT = "suspect"
    ROLE_VICTIM = "victim"
    ROLE_WITNESS = "witness"
    ROLE_CHOICES = [
        (ROLE_SUSPECT, "Suspect"),
        (ROLE_VICTIM, "Victim"),
        (ROLE_WITNESS, "Witness"),
    ]

    case = models.ForeignKey(Cases, on_delete=models.CASCADE, related_name="participants",)
    person_arrested = models.ForeignKey(Create_Arrests, on_delete=models.PROTECT, related_name="case_participations",)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_primary = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["case", "person_arrested", "role"],
                name="unique_participant_per_case_role",
            ),
            models.UniqueConstraint(
                fields=["case", "role"],
                condition=models.Q(is_primary=True),
                name="unique_primary_per_case_role",
            ),
        ]
        indexes = [models.Index(fields=["case", "role"])]

    def __str__(self):
        return f"{self.person_arrested} — {self.role}"

# ============================================================
# Evidence
# ============================================================
class Evidence(InstitutionScoped):
    TYPE_DRUG = "drug"
    TYPE_WEAPON = "weapon"
    TYPE_DOCUMENT = "document"
    TYPE_ELECTRONICS = "electronics"
    TYPE_OTHER = "other"

    EVIDENCE_TYPE_CHOICES = [
        (TYPE_DRUG, "Drug / Narcotic"),
        (TYPE_WEAPON, "Weapon"),
        (TYPE_DOCUMENT, "Document"),
        (TYPE_ELECTRONICS, "Electronics"),
        (TYPE_OTHER, "Other"),
    ]

    STATUS_STORED = "stored"
    STATUS_ANALYZED = "analyzed"
    STATUS_DESTROYED = "destroyed"
    STATUS_SUBMITTED = "submitted_to_court"

    EVIDENCE_STATUS = [
        (STATUS_STORED, "Stored"),
        (STATUS_ANALYZED, "Analyzed"),
        (STATUS_DESTROYED, "Destroyed"),
        (STATUS_SUBMITTED, "Submitted to Court"),
    ]

    evidence_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True,)
    arrest_preson = models.ForeignKey(Create_Arrests, on_delete=models.SET_NULL, null=True, blank=True, related_name="evidences",)
    case = models.ForeignKey(Cases, on_delete=models.SET_NULL, null=True, blank=True, related_name="evidences",)
    drug_type = models.ForeignKey(DrugType, on_delete=models.SET_NULL, null=True, blank=True, related_name="evidences",)
    name = models.CharField(max_length=255)
    evidence_type = models.CharField(max_length=50, choices=EVIDENCE_TYPE_CHOICES, default=TYPE_OTHER,)
    quantity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0)],)
    unit = models.CharField(max_length=50, blank=True)
    county = models.CharField(max_length=50, blank=True, db_index=True)
    district = models.CharField(max_length=50, blank=True)
    location_description = models.TextField(blank=True)
    collected_by = models.CharField(max_length=255, blank=True)
    badge_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, choices=EVIDENCE_STATUS, default=STATUS_STORED, db_index=True,)
    remarks = models.TextField(blank=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta: # type: ignore
        ordering = ["-created_at"]
        verbose_name_plural = "Evidence"
        indexes = [models.Index(fields=["status", "county"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.name}-{self.evidence_id}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.evidence_type})"