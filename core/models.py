import uuid

from django.conf import settings
from django.db import models
from .Manager import SoftDeleteManager

# Create your models here.
User = settings.AUTH_USER_MODEL

class BaseModel(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_DELETED = "deleted"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_DELETED, "Deleted"),
    ]
    record_state = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True,)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+",)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+",)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True


class InstitutionScoped(BaseModel):
    """Adds an Institution FK for multi-tenant scoping."""

    institution = models.ForeignKey(
        "accounts.Institution",
        on_delete=models.PROTECT,
        related_name="+",
        db_index=True,
    )

    class Meta: # type: ignore
        abstract = True
