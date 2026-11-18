from decimal import Decimal  # <--- ADDED THIS IMPORT
from django.db import models
from django.conf import settings
from LDEA.models import Cases
from core.models import InstitutionScoped

User = settings.AUTH_USER_MODEL

# ============================================================
# 1. Legal Review
# ============================================================
class LegalReview(InstitutionScoped):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending_info", "Awaiting Info from LDEA"),
        ("recommended", "Recommended for Prosecution"),
        ("rejected", "Recommended for Closure"),
    ]
    case = models.ForeignKey(Cases, on_delete=models.CASCADE, related_name="legal_reviews")
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="moj_legal_reviews")
    summary = models.TextField(blank=True, help_text="Summary of the allegations and evidence")
    gaps_identified = models.TextField(blank=True, help_text="Identified evidentiary gaps")
    decision = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    review_date = models.DateTimeField(auto_now=True)

    class Meta: # type: ignore
        ordering = ["-review_date"]

    def __str__(self):
        return f"Review for {self.case.case_number} - {self.get_decision_display()}"


# ============================================================
# 2. Information Request
# ============================================================
class InformationRequest(InstitutionScoped):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("responded", "Response Submitted"),
        ("resolved", "Resolved"),
        ("cancelled", "Cancelled"),
    ]
    case = models.ForeignKey(Cases, on_delete=models.CASCADE, related_name="info_requests")
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="moj_info_requests")
    request_details = models.TextField(help_text="What information is needed from LDEA?")
    response_details = models.TextField(blank=True, help_text="LDEA's response")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["-created_at"]


# ============================================================
# 3. Court Case
# ============================================================
class CourtCase(InstitutionScoped):
    STATUS_CHOICES = [
        ("filed", "Filed in Court"),
        ("ongoing", "Ongoing"),
        ("closed", "Concluded"),
    ]
    original_case = models.ForeignKey(Cases, on_delete=models.CASCADE, related_name="court_cases")
    court_name = models.CharField(max_length=255)
    court_case_number = models.CharField(max_length=100, unique=True, help_text="Must be provided by the court")
    filing_date = models.DateField()
    prosecutor = models.CharField(max_length=255, blank=True, null=True, help_text="Name of the prosecutor")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="filed")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["-filing_date"]

    def __str__(self):
        return f"Court Case {self.court_case_number} for {self.original_case.case_number}"


# ============================================================
# 4. Court Hearings
# ============================================================
class CourtHearing(InstitutionScoped):
    court_case = models.ForeignKey(CourtCase, on_delete=models.CASCADE, related_name="hearings")
    hearing_date = models.DateField()
    hearing_time = models.TimeField(null=True, blank=True)
    hearing_type = models.CharField(max_length=100, help_text="e.g., Arraignment, Trial, Mention")
    outcome = models.TextField(blank=True, help_text="Details of what happened")
    is_adjourned = models.BooleanField(default=False)
    adjournment_reason = models.TextField(blank=True)
    next_hearing_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["-hearing_date", "-hearing_time"]


# ============================================================
# 5. Court Orders & Judgments
# ============================================================
class CourtOrder(InstitutionScoped):
    OUTCOME_CHOICES = [
        ("conviction", "Conviction"),
        ("acquittal", "Acquittal"),
        ("dismissal", "Dismissal"),
        ("withdrawal", "Withdrawal"),
        ("other", "Other"),
    ]
    court_case = models.ForeignKey(CourtCase, on_delete=models.CASCADE, related_name="orders")
    judgment_type = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    date_issued = models.DateField()
    summary = models.TextField(help_text="Summary of the judgment or court order")
    has_fine = models.BooleanField(default=False, help_text="Did the court impose a fine?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["-date_issued"]
    # REMOVED the outstanding_balance property from here (it doesn't belong here)


# ============================================================
# 6. Fine Management
# ============================================================
class Fine(InstitutionScoped):
    court_order = models.OneToOneField(CourtOrder, on_delete=models.CASCADE, related_name="fine")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total amount imposed")
    currency = models.CharField(max_length=3, default="USD", help_text="e.g., USD, LRD")
    deadline = models.DateField(null=True, blank=True)
    
    @property
    def outstanding_balance(self):
        # FIXED: Using Decimal('0.00') to prevent TypeError crash
        verified_payments = self.payments.filter(status="verified").aggregate(models.Sum('amount'))['amount__sum'] or Decimal('0.00')
        return self.total_amount - verified_payments

    def __str__(self):
        return f"Fine for {self.court_order.court_case.court_case_number}"


class FinePayment(InstitutionScoped):
    STATUS_CHOICES = [
        ("pending", "Pending Verification"),
        ("verified", "Verified by Authority"),
        ("rejected", "Rejected / Bounced"),
    ]
    fine = models.ForeignKey(Fine, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    transaction_reference = models.CharField(max_length=100, help_text="Bank slip or receipt number")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="moj_verified_payments")
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta: # type: ignore
        ordering = ["-payment_date"]


# ============================================================
# 7. Appeals
# ============================================================
class Appeal(InstitutionScoped):
    STATUS_CHOICES = [
        ("filed", "Filed"),
        ("ongoing", "Ongoing"),
        ("dismissed", "Dismissed"),
        ("allowed", "Allowed / Overturned"),
    ]
    court_case = models.ForeignKey(CourtCase, on_delete=models.CASCADE, related_name="appeals")
    appealing_party = models.CharField(max_length=100, help_text="e.g., Defendant, Prosecution")
    date_filed = models.DateField()
    grounds_for_appeal = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="filed")
    outcome = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: # type: ignore
        ordering = ["-date_filed"]
class CaseAssignment(InstitutionScoped):
    """Tracks which prosecutor is assigned to an LDEA case."""
    case = models.ForeignKey(Cases, on_delete=models.CASCADE, related_name="moj_assignments")
    prosecutor = models.CharField(max_length=255, help_text="Name of the assigned prosecutor")
    assigned_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta: # type: ignore
        ordering = ["-assigned_date"]        