from django.db import models
# ============================================================
# Managers
# ============================================================


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.exclude(record_state="deleted")

    def active(self):
        return self.filter(record_state="active")


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Default manager. Hides soft-deleted rows."""

    def get_queryset(self):
        return super().get_queryset().exclude(
            record_state="deleted",
        )

