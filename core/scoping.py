from dataclasses import dataclass, field
from typing import Optional

from django.conf import settings
from django.db.models import Q, QuerySet

EMPTY_SCOPE_MEANS = getattr(settings, "NDO_EMPTY_SCOPE_MEANS", "deny")
NULL_COUNTY_VISIBLE = getattr(settings, "NDO_NULL_COUNTY_VISIBLE", False)


@dataclass(frozen=True)
class Scope:
    institution_ids: list = field(default_factory=list)
    counties: list = field(default_factory=list)
    unrestricted_institution_ids: list = field(default_factory=list)
    is_superuser: bool = False

    @property
    def is_empty(self) -> bool:
        return not self.is_superuser and not self.institution_ids


def resolve_scope(user, requested_institution_id: Optional[int] = None) -> Scope:
    if not user or not user.is_authenticated:
        return Scope()
    if user.is_superuser:
        return Scope(is_superuser=True)

    from accounts.models import InstitutionMembership

    qs = InstitutionMembership.objects.filter(
        user=user,
        is_active=True,
        institution__is_active=True,
    )
    if requested_institution_id is not None:
        qs = qs.filter(institution_id=requested_institution_id)

    institution_ids, counties, unrestricted = set(), set(), []

    for m in qs:
        institution_ids.add(m.institution_id)
        m_counties = [
            c.strip() for c in (m.counties or [])
            if isinstance(c, str) and c.strip()
        ]
        if not m_counties:
            unrestricted.append(m.institution_id)
        else:
            counties.update(m_counties)

    return Scope(
        institution_ids=sorted(institution_ids),
        counties=sorted(counties),
        unrestricted_institution_ids=sorted(unrestricted),
        is_superuser=False,
    )


def scope_queryset(
    qs: QuerySet, 
    scope: Scope, 
    *, 
    county_field: str = "county", 
    check_institution: bool = True
) -> QuerySet:
    """
    Applies institution and county scoping to a QuerySet.
    
    If check_institution=False, it skips the Institution filter. This is used 
    for cross-app reads (e.g., MOG users reading LDEA victims) where the 
    record's institution will never match the user's institution, but the 
    county scope must still be enforced.
    """
    if scope.is_superuser:
        return qs
    if scope.is_empty:
        return qs.none()

    model_fields = {f.name for f in qs.model._meta.get_fields()}

    # 1. Institution boundary
    if check_institution and "institution" in model_fields:
        qs = qs.filter(institution_id__in=scope.institution_ids)

    # 2. County boundary
    if "__" in county_field:
        has_county = True
    else:
        has_county = county_field in model_fields

    if not has_county:
        return qs

    if set(scope.unrestricted_institution_ids) == set(scope.institution_ids):
        return qs

    if not scope.counties and EMPTY_SCOPE_MEANS == "deny":
        return qs.none()

    county_q = Q()
    for c in scope.counties:
        county_q |= Q(**{f"{county_field}__iexact": c})

    if NULL_COUNTY_VISIBLE:
        county_q |= Q(**{f"{county_field}__isnull": True}) | Q(**{f"{county_field}": ""})

    return qs.filter(county_q).distinct()