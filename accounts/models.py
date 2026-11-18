
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class Institution(models.Model):
    INSTITUTION_CHOICES = [
        ("MOJ", "Ministry of Justice"),
        ("LDEA", "Liberia Drug Enforcement Agency"),
        ("MOH", "Ministry of Health"),
        ("MOG", "Ministry of Gender, Children and Social Protection"),
        ("MOYS", "Ministry of Youth and Sports"),
    ]

    name = models.CharField(
        max_length=20,
        choices=INSTITUTION_CHOICES,
        unique=True,)
    code = models.CharField(
        max_length=20,
        choices=INSTITUTION_CHOICES,
        unique=True,
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class CustomUser(AbstractUser):
    middle_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)

    def get_full_name(self):
        return " ".join(
            part for part in [
                self.first_name,
                self.middle_name,
                self.last_name,
            ] if part
        )

    def __str__(self):
        return self.get_full_name() or self.username


class UserProfile(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
    )
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True,
    )
    job_title = models.CharField(max_length=150, blank=True)
    department = models.CharField(max_length=150, blank=True)
    employee_number = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Profile: {self.user}"


class InstitutionMembership(models.Model):
    ROLE_CHOICES = [
        ("institution_admin", "Institution Administrator"),
        ("department_head", "Department Head"),
        ("data_officer", "Data Officer"),
        # ("analyst", "Data Analyst"),
        # ("viewer", "Read-only Viewer"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="institution_memberships",
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
    )
    counties = models.JSONField(
        default=list, blank=True,
        help_text=(
            "County names this membership is scoped to. "
            "Empty list means the member sees all counties in the institution."
        )
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "institution"],
                name="unique_user_institution_membership",
            )
        ]

    def __str__(self):
        return (
            f"{self.user} - {self.institution.name} "
            f"({self.role})"
        )
        
class UserActivityLog(models.Model):
    ACTIONS = [
        ("login", "Logged In"),
        ("logout", "Logged Out"),
        ("login_failed", "Failed Login"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="activity_logs")
    institution = models.ForeignKey("accounts.Institution", on_delete=models.SET_NULL, null=True, blank=True, related_name="activity_logs")
    action = models.CharField(max_length=20, choices=ACTIONS)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True, help_text="City, Country (if resolved)")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "User Activity Log"
        verbose_name_plural = "User Activity Logs"
        indexes = [
            models.Index(fields=["institution", "-timestamp"]),
        ]
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"