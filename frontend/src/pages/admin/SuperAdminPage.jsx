import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Building2, Users, ShieldCheck, Crown, LayoutGrid, ChevronRight } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useRoles } from "../../hooks/useRoles";
import { StatCard } from "../../components/admin/ui";
import UsersAdminPage from "./UsersAdminPage";
import MembershipsAdminPage from "./MembershipAdminPage";

// --- Added this mapping so we don't need to import it ---
const INSTITUTION_NAMES = {
  MOJ: "Ministry of Justice",
  LDEA: "Liberia Drug Enforcement Agency",
  MOH: "Ministry of Health",
  MOG: "Ministry of Gender",
  MOYS: "Ministry of Youth and Sports",
};

const labelOf = (code) => INSTITUTION_NAMES[code] || code;
// -------------------------------------------------------

const TABS = [
  { id: "overview", label: "Institutions", icon: LayoutGrid },
  { id: "users", label: "Users", icon: Users },
  { id: "memberships", label: "Memberships", icon: ShieldCheck },
];

const SCOPE_ALL = null; // "no institution filter" as your API expects it

const countOf = (r) =>
  r.status !== "fulfilled"
    ? null
    : Array.isArray(r.value)
      ? r.value.length
      : r.value?.count ?? r.value?.results?.length ?? null;

export default function SuperAdminPage() {
  const { isSuperuser } = useRoles();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "overview";

  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(true);
  const [perInst, setPerInst] = useState({}); // { [id]: { users, memberships } }
  const [totals, setTotals] = useState({ users: null, memberships: null });
  const [filterId, setFilterId] = useState(SCOPE_ALL);

  const loadCounts = useCallback(async (list) => {
    const args = (institutionId) => ({ page: 1, search: "", institutionId });

    const [u, m] = await Promise.allSettled([
      adminService.listUsers(args(SCOPE_ALL)),
      adminService.listMemberships(args(SCOPE_ALL)),
    ]);
    setTotals({ users: countOf(u), memberships: countOf(m) });

    const rows = await Promise.all(
      list.map(async (inst) => {
        const [iu, im] = await Promise.allSettled([
          adminService.listUsers(args(inst.id)),
          adminService.listMemberships(args(inst.id)),
        ]);
        return [inst.id, { users: countOf(iu), memberships: countOf(im) }];
      }),
    );
    setPerInst(Object.fromEntries(rows));
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const list = await adminService.listInstitutions();
      const items = Array.isArray(list) ? list : list?.results ?? [];
      setInstitutions(items);
      await loadCounts(items);
    } catch {
      /* leave empty state */
    } finally {
      setInstLoading(false);
    }
  }, [loadCounts]);

  useEffect(() => {
    if (isSuperuser) loadAll();
  }, [isSuperuser, loadAll]);

  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.id === filterId) ?? null,
    [institutions, filterId],
  );

  if (!isSuperuser) return <Navigate to="/dashboard" replace />;

  function openInstitution(id, nextTab = "users") {
    setFilterId(id);
    setParams({ tab: nextTab }, { replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-primary">System administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Super admin console</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Manage every institution, account, and role across the observatory.
        </p>
      </header>

      <section aria-label="Summary" className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Institutions" value={instLoading ? null : institutions.length} loading={instLoading} hint="Registered agencies" />
        <StatCard icon={Users} label="Users" value={totals.users?.toLocaleString()} loading={instLoading} hint="Across all institutions" />
        <StatCard icon={ShieldCheck} label="Memberships" value={totals.memberships?.toLocaleString()} loading={instLoading} hint="Roles assigned" />
        <StatCard icon={Crown} label="Your access" value="Superuser" hint="System-wide" />
      </section>

      {/* Tabs */}
      <div className="border-b border-base-300">
        <nav role="tablist" aria-label="Super admin sections" className="-mb-px flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setParams({ tab: id }, { replace: true })}
                className={
                  "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
                  (active
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/60 hover:border-base-300 hover:text-base-content")
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Institution filter (users / memberships only) */}
      {tab !== "overview" && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-base-content/70">
            <Building2 className="size-4" aria-hidden="true" />
            <span className="font-medium">Institution</span>
            <select
              value={filterId ?? ""}
              onChange={(e) => setFilterId(e.target.value === "" ? SCOPE_ALL : Number(e.target.value))}
              className="select select-bordered select-sm h-10 rounded-xl text-sm"
            >
              <option value="">All institutions</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{labelOf(i.code)}</option>
              ))}
            </select>
          </label>
          {selectedInstitution && (
            <span className="text-xs text-base-content/55">
              Showing {labelOf(selectedInstitution.code)} only
            </span>
          )}
        </div>
      )}

      <div role="tabpanel" key={`${tab}-${filterId ?? "all"}`}>
        {tab === "overview" && (
          <InstitutionGrid
            institutions={institutions}
            counts={perInst}
            loading={instLoading}
            onOpen={openInstitution}
          />
        )}
        {tab === "users" && (
          <UsersAdminPage
            institutionId={filterId}
            allowAdminRole
            defaultInstitutionCode={selectedInstitution?.code ?? selectedInstitution?.name ?? ""}
            onChanged={loadAll}
          />
        )}
        {tab === "memberships" && (
          <MembershipsAdminPage institutionId={filterId} onChanged={loadAll} />
        )}
      </div>
    </div>
  );
}

function InstitutionGrid({ institutions, counts, loading, onOpen }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border border-base-300 bg-base-200/50" />
        ))}
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-6 py-14 text-center text-sm text-base-content/60">
        No institutions found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {institutions.map((inst) => {
        const c = counts[inst.id] ?? {};
        return (
          <article
            key={inst.id}
            className="flex flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                {/* Shows the full agency name */}
                <h2 className="truncate text-sm font-semibold">
                  {labelOf(inst.code) || inst.name}
                </h2>
                {/* Shows the short code */}
                {inst.code && (
                  <p className="mt-0.5 font-mono text-xs text-base-content/50">{inst.code}</p>
                )}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-base-300 pt-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-base-content/50">Users</dt>
                <dd className="text-lg font-semibold tabular-nums">{c.users ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-base-content/50">Memberships</dt>
                <dd className="text-lg font-semibold tabular-nums">{c.memberships ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => onOpen(inst.id, "users")} className="btn btn-outline btn-xs h-8 flex-1 rounded-lg normal-case">
                Users <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onOpen(inst.id, "memberships")} className="btn btn-outline btn-xs h-8 flex-1 rounded-lg normal-case">
                Memberships <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}