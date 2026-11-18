# core/management/commands/audit_scoping.py
import importlib
import inspect

from django.apps import apps
from django.core.management.base import BaseCommand
from rest_framework.viewsets import ViewSetMixin

from core.mixins import CountyScopedMixin


class Command(BaseCommand):
    help = "List viewsets whose model has a `county` field but which are not CountyScopedMixin."

    def handle(self, *args, **options):
        self.stdout.write("\n=== Models with a `county` field ===\n")
        county_models = []
        for model in apps.get_models():
            names = {f.name for f in model._meta.get_fields()}
            if "county" in names:
                county_models.append(model)

        for m in sorted(county_models, key=lambda x: x.__name__):
            self.stdout.write(f"  OK   {m._meta.app_label}.{m.__name__}")
        self.stdout.write(f"\nTotal: {len(county_models)} models need scoping.\n")

        self.stdout.write("=== Viewsets MISSING CountyScopedMixin ===\n")
        missing = 0
        for app_config in apps.get_app_configs():
            try:
                views_mod = importlib.import_module(f"{app_config.name}.views")
            except ImportError:
                continue
            for name, cls in inspect.getmembers(views_mod, inspect.isclass):
                if not issubclass(cls, ViewSetMixin):
                    continue
                if cls.__module__ != views_mod.__name__:
                    continue

                model = getattr(cls, "model", None)
                if model is None:
                    qs = getattr(cls, "queryset", None)
                    model = getattr(qs, "model", None) if qs is not None else None
                if model is None:
                    continue

                has_county = "county" in {f.name for f in model._meta.get_fields()}
                if has_county and not issubclass(cls, CountyScopedMixin):
                    self.stdout.write(
                        f"  MISSING  {views_mod.__name__}.{name}  "
                        f"-> model={model.__name__}"
                    )
                    missing += 1

        if missing == 0:
            self.stdout.write(self.style.SUCCESS("\nAll county-scoped viewsets are protected.\n"))
        else:
            self.stdout.write(self.style.WARNING(f"\n{missing} viewset(s) missing the mixin.\n"))