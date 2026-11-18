import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRoles } from "./useRoles";
import { COUNTY_OPTIONS } from "../constants/counties";

// "River Cess", "river_cess" and "Rivercess" all become "rivercess"
const key = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Returns the county options the current user may use.
 * Mirrors the backend rule (county_limit_for):
 *  - superuser, or any membership with an empty counties list -> all counties
 *  - otherwise the union of counties across the user's memberships
 *
 * Pass a different option list (e.g. the MOG snake_case COUNTIES) as the
 * argument; it defaults to COUNTY_OPTIONS.
 */
export function useAllowedCounties(allOptions = COUNTY_OPTIONS) {
  const { memberships } = useAuth();
  const { isSuperuser } = useRoles();

  return useMemo(() => {
    if (isSuperuser) return { options: allOptions, restricted: false };

    const lists = (memberships ?? []).map((m) =>
      (m.counties ?? []).filter((c) => typeof c === "string" && c.trim())
    );

    // No memberships loaded yet, or any unrestricted membership -> all
    if (lists.length === 0 || lists.some((l) => l.length === 0)) {
      return { options: allOptions, restricted: false };
    }

    const allowed = new Set(lists.flat().map(key));
    return {
      options: allOptions.filter((o) => allowed.has(key(o.value))),
      restricted: true,
    };
  }, [memberships, isSuperuser, allOptions]);
}