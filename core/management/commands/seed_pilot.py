"""
Seed pilot users, institutions and memberships into the active database.

This recreates the same accounts that exist in the local sqlite db so the
pilot can be run against the Sevalla PostgreSQL database. Every account is
given the SAME shared password (settings below) so testers can click-to-login.

Idempotent: safe to run repeatedly. It updates existing rows instead of
duplicating them.

Usage (runs against whatever DATABASE_URL / DATABASES points at):

    python manage.py seed_pilot
    python manage.py seed_pilot --password "Pilot@2026"
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import (
    Institution,
    CustomUser,
    UserProfile,
    InstitutionMembership,
)

DEFAULT_PASSWORD = "Pilot@2026"

INSTITUTIONS = [
    ("MOJ", "Ministry of Justice"),
    ("LDEA", "Liberia Drug Enforcement Agency"),
    ("MOH", "Ministry of Health"),
    ("MOG", "Ministry of Gender, Children and Social Protection"),
    ("MOYS", "Ministry of Youth and Sports"),
]

# (username, email, first_name, last_name, is_superuser, institution_code, role)
# institution_code/role are None for the platform superuser.
USERS = [
    ("admin", "admin@ndo.local", "System", "Administrator", True, None, None),

    ("moj_institution_admin", "moj_institution_admin@ndo.local", "Institution Administrator", "MOJ", False, "MOJ", "institution_admin"),
    ("moj_department_head", "moj_department_head@ndo.local", "Department Head", "MOJ", False, "MOJ", "department_head"),
    ("moj_data_officer", "moj_data_officer@ndo.local", "Data Officer", "MOJ", False, "MOJ", "data_officer"),

    ("ldea_institution_admin", "ldea_institution_admin@ndo.local", "Institution Administrator", "LDEA", False, "LDEA", "institution_admin"),
    ("ldea_department_head", "ldea_department_head@ndo.local", "Department Head", "LDEA", False, "LDEA", "department_head"),
    ("ldea_data_officer", "ldea_data_officer@ndo.local", "Data Officer", "LDEA", False, "LDEA", "data_officer"),

    ("moh_institution_admin", "moh_institution_admin@ndo.local", "Institution Administrator", "MOH", False, "MOH", "institution_admin"),
    ("moh_department_head", "moh_department_head@ndo.local", "Department Head", "MOH", False, "MOH", "department_head"),
    ("moh_data_officer", "moh_data_officer@ndo.local", "Data Officer", "MOH", False, "MOH", "data_officer"),

    ("mog_institution_admin", "mog_institution_admin@ndo.local", "Institution Administrator", "MOG", False, "MOG", "institution_admin"),
    ("mog_department_head", "mog_department_head@ndo.local", "Department Head", "MOG", False, "MOG", "department_head"),
    ("mog_data_officer", "mog_data_officer@ndo.local", "Data Officer", "MOG", False, "MOG", "data_officer"),

    ("moys_institution_admin", "moys_institution_admin@ndo.local", "Institution Administrator", "MOYS", False, "MOYS", "institution_admin"),
    ("moys_department_head", "moys_department_head@ndo.local", "Department Head", "MOYS", False, "MOYS", "department_head"),
    ("moys_data_officer", "moys_data_officer@ndo.local", "Data Officer", "MOYS", False, "MOYS", "data_officer"),

    ("mog_child_tracking_admin", "mog_child_tracking_admin@ndo.local", "Institution Administrator", "Child Tracking", False, "MOG", "institution_admin"),
    ("mog_child_tracking_head", "mog_child_tracking_head@ndo.local", "Department Head", "Child Tracking", False, "MOG", "department_head"),
    ("mog_child_tracking_officer", "mog_child_tracking_officer@ndo.local", "Data Officer", "Child Tracking", False, "MOG", "data_officer"),
]


class Command(BaseCommand):
    help = "Seed pilot institutions, users and memberships with a shared password."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Shared password for every seeded account (default: {DEFAULT_PASSWORD}).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]

        institutions = {}
        for code, name in INSTITUTIONS:
            inst, _ = Institution.objects.update_or_create(
                code=code,
                defaults={"name": code, "description": name, "is_active": True},
            )
            institutions[code] = inst
        self.stdout.write(self.style.SUCCESS(f"Institutions ready: {len(institutions)}"))

        created = 0
        updated = 0
        for username, email, first, last, is_super, inst_code, role in USERS:
            user, was_created = CustomUser.objects.get_or_create(
                username=username,
                defaults={"email": email},
            )
            user.email = email
            user.first_name = first
            user.last_name = last
            user.is_active = True
            user.is_superuser = is_super
            user.is_staff = is_super
            user.set_password(password)
            user.save()

            UserProfile.objects.get_or_create(user=user)

            if inst_code and role:
                InstitutionMembership.objects.update_or_create(
                    user=user,
                    institution=institutions[inst_code],
                    defaults={"role": role, "counties": [], "is_active": True},
                )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Users seeded. created={created} updated={updated} "
            f"total={created + updated}"
        ))
        self.stdout.write(self.style.WARNING(
            f"Shared password for ALL accounts: {password}"
        ))
