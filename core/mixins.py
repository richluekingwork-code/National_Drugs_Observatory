from core.scoping import resolve_scope, scope_queryset


class CountyScopedMixin:
    scope_county_field = "county"

    def get_scope(self):
        if not hasattr(self, "_scope"):
            requested = self._requested_institution_id()
            self._scope = resolve_scope(
                self.request.user,
                requested_institution_id=int(requested) if requested else None,
            )
        return self._scope

    def _requested_institution_id(self):
        inst = self.request.query_params.get("institution_id")
        if inst:
            return inst
        try:
            return self.request.data.get("institution_id")
        except Exception:
            return None

    def get_queryset(self):
        queryset = getattr(self, "queryset", None)
        if queryset is not None:
            base_qs = queryset.all() if hasattr(queryset, "all") else queryset
        elif hasattr(self, "model"):
            base_qs = self.model.objects.all()
        else:
            raise AssertionError(
                f"{type(self).__name__} must define `queryset` or `model`."
            )

        # MAKE SURE THIS LINE HAS `return` !!!
        return scope_queryset(
            base_qs,
            self.get_scope(),
            county_field=self.scope_county_field,
        )