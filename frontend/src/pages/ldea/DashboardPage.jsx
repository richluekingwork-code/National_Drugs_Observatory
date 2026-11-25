import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen, ShieldAlert, Pill, Users, Activity,
  RefreshCw, AlertCircle, ArrowUpRight, MapPin, FlaskConical, Inbox,
} from "lucide-react";
import { ldeaService } from "../../services/ldeaService";
import AnalyticsPage from "./analytics/AnalyticsPage";

const STAT_META = [
  { key: "victims",    label: "Victims",    icon: Users,       to: "/victim-histories", chip: "bg-primary/10 text-primary" },
  { key: "seizures",   label: "Seizures",   icon: Pill,        to: "/seizures",         chip: "bg-secondary/10 text-secondary" },
  { key: "arrests",    label: "Arrests",    icon: ShieldAlert, to: "/arrests",          chip: "bg-warning/15 text-warning-content" },
  { key: "cases",      label: "Cases",      icon: FolderOpen,  to: "/cases",            chip: "bg-accent/10 text-accent" },
  { key: "drug_raids", label: "Drug raids", icon: Activity,    to: "/raids",            chip: "bg-error/10 text-error" },
];

const asList = (d) => (Array.isArray(d) ? d : d?.results ?? []);

export default function DashboardPage() {
  const [counts, setCounts] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      ldeaService.dashboard.counts(),
      ldeaService.dashboard.hotspots(),
      ldeaService.dashboard.traffickedDrugs(),
    ])
      .then(([c, h, d]) => {
        if (cancelled) return;
        
        // DEBUG: Look at your browser console (F12) to see what the backend sent
        console.log("Hotspots data from backend:", h);
        
        setCounts(c);
        setHotspots(asList(h));
        setDrugs(asList(d));
        setUpdatedAt(new Date());
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "The dashboard data could not be loaded.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [reloadKey]);

  // SAFE FALLBACK: Ensure it is always an array so .slice() never crashes
  const safeHotspots = Array.isArray(hotspots) ? hotspots : [];
  const safeDrugs = Array.isArray(drugs) ? drugs : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-base-content/60">
            An operational snapshot for the current institution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && !loading && (
            <span className="text-xs text-base-content/50">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            className="btn btn-outline btn-sm h-9 rounded-lg"
          >
            <RefreshCw className={"size-3.5 " + (loading ? "animate-spin" : "")} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium">Couldn't load the dashboard</p>
            <p className="mt-0.5 text-xs text-error/80">{error}</p>
          </div>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-ghost btn-xs rounded-md text-error">
            Try again
          </button>
        </div>
      )}

      {/* KPI cards */}
      <section aria-label="Totals" className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {STAT_META.map(({ key, label, icon: Icon, to, chip }) => (
          <Link
            key={key}
            to={to}
            className="group rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex items-center justify-between">
              <span className={"grid size-9 place-items-center rounded-lg " + chip}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <ArrowUpRight className="size-4 text-base-content/25 transition-colors group-hover:text-primary" aria-hidden="true" />
            </div>
            <p className="mt-4 text-xs text-base-content/60">{label}</p>
            {loading ? (
              <div className="mt-1.5 h-7 w-16 animate-pulse rounded bg-base-300/60" aria-label="Loading" />
            ) : (
              <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
                {Number(counts?.[key] ?? 0).toLocaleString()}
              </p>
            )}
          </Link>
        ))}
      </section>

      {/* Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RankedList
          title="Top counties"
          subtitle="Combined activity (Victims, Arrests, Cases, Raids)"
          icon={MapPin}
          rows={safeHotspots.slice(0, 6).map((r) => ({
            // Depending on your backend output, it might be r.county or r.incident_county
            label: r.county || r.incident_county || r.county_of_arrests || "Unknown",
            value: Number(r.total_cases) || 0,
          }))}
          loading={loading}
          bar="bg-primary"
        />

        <RankedList
          title="Most trafficked"
          subtitle="Seizures by drug type"
          icon={FlaskConical}
          rows={safeDrugs.slice(0, 6).map((r) => ({
            label: r.drug_type || "Unknown", 
            value: Number(r.total_cases) || 0,
            secondary: r.total_quantity ? `${r.total_quantity} units` : null,
          }))}
          loading={loading}
          bar="bg-secondary"
        />
      </div>

      {/* Analytics */}
      <section aria-label="Analytics">
        <AnalyticsPage />
      </section>
    </div>
  );
}

function RankedList({ title, subtitle, icon: Icon, rows, loading, bar }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-base-300 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-base-content/55">{subtitle}</p>
        </div>
        {Icon && <Icon className="size-4 text-base-content/35" aria-hidden="true" />}
      </div>

      <div className="p-5">
        {loading && (
          <ul className="space-y-5" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-base-300/60" />
                  <div className="h-3.5 w-10 animate-pulse rounded bg-base-300/60" />
                </div>
                <div className="h-1.5 animate-pulse rounded-full bg-base-300/50" />
              </li>
            ))}
          </ul>
        )}

        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-base-200 text-base-content/40">
              <Inbox className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-base-content/60">No data yet.</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <ol className="space-y-4">
            {rows.map((r, i) => (
              <li key={`${r.label}-${i}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span className="w-4 shrink-0 text-xs tabular-nums text-base-content/40">{i + 1}</span>
                    <span className="truncate font-medium">{r.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold">{r.value.toLocaleString()}</span>
                    {r.secondary && (
                      <span className="ml-2 text-xs text-base-content/50">{r.secondary}</span>
                    )}
                  </span>
                </div>
                <div className="ml-[1.625rem] mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-200">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${bar}`}
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}