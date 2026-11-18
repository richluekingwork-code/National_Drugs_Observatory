from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import UserActivityLog

class Command(BaseCommand):
    help = "Backfill institution on existing activity logs"

    @transaction.atomic
    def handle(self, *args, **options):

        logs = UserActivityLog.objects.filter(
            institution__isnull=True,
            user__isnull=False,
        ).select_related("user")

        updated = 0

        for log in logs.iterator():

            membership = log.user.institution_memberships.filter(
                is_active=True,
                institution__is_active=True,
            ).select_related("institution").first()

            if membership:
                log.institution = membership.institution
                log.save(update_fields=["institution"])
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully updated {updated} activity logs."
            )
        )