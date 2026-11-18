import { useEffect, useState } from "react";
import { Users, Pill, ShieldAlert, FolderOpen } from "lucide-react";
import { ldeaService } from "../../../services/ldeaService";

const KPIS = [
  { key: "persons",  label: "Persons on record", icon: Users,       tint: "text-primary" },
  { key: "seizures", label: "Seizures logged",   icon: Pill,        tint: "text-secondary" },
  { key: "arrests",  label: "Arrests recorded",  icon: ShieldAlert, tint: "text-warning" },
  { key: "cases",    label: "Active case files", icon: FolderOpen,  tint: "text-accent" },
];

export function KpiStrip({ refreshKey }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    ldeaService.dashboard.counts()
      .then(setCounts)
      .catch(() => setCounts(null));
  }, [refreshKey]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map(({ key, label, icon: Icon, tint }) => (
        <div
          key={key}
          className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-base-content/50">
              {label}
            </span>
            <span
              className={`grid size-7 place-items-center rounded-md bg-base-200/70 ${tint}`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums leading-none">
            {counts ? (counts[key] ?? 0).toLocaleString() : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}