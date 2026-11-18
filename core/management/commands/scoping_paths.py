# core/management/commands/scoping_paths.py
from collections import deque

from django.apps import apps
from django.core.management.base import BaseCommand


def _rel_forward(f):
    """Forward relations: FK or OneToOne owned by this model."""
    return (
        f.is_relation
        and (f.many_to_one or f.one_to_one)
        and not f.auto_created
    )


def find_county_path(model, max_depth=8):
    if "county" in {f.name for f in model._meta.get_fields()}:
        return "county"
    queue = deque([(model, [])])
    visited = {model}
    while queue:
        current, path = queue.popleft()
        if len(path) >= max_depth:
            continue
        for f in current._meta.get_fields():
            if not _rel_forward(f):
                continue
            related = f.related_model
            if related in visited:
                continue
            visited.add(related)
            new_path = path + [f.name]
            if "county" in {x.name for x in related._meta.get_fields()}:
                return "__".join(new_path + ["county"])
            queue.append((related, new_path))
    return None


class Command(BaseCommand):
    help = "For every model in an app, print the FK path to a county field."

    def add_arguments(self, parser):
        parser.add_argument("app", help="App label, e.g. MOG, MOH, MOYS, LDEA")

    def handle(self, *args, **opts):
        try:
            app = apps.get_app_config(opts["app"])
        except LookupError:
            self.stderr.write(f"App not found: {opts['app']}")
            return
        self.stdout.write(f"\n=== {app.label} ===")
        for model in app.get_models():
            path = find_county_path(model)
            tag = path if path else "(no county path)"
            self.stdout.write(f"  {model.__name__:<34} {tag}")