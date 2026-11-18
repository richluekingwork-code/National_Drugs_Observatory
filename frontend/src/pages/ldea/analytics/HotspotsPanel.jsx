import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ldeaService } from "../../../services/ldeaService";

export function HotspotsPanel({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ldeaService.dashboard.hotspots({ year })
      .then((d) => !cancelled && setRows(d))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [year]);

  const max = Math.max(1, ...rows.map((r) => r.total_cases));
  const total = rows.reduce((s, r) => s + r.total_cases, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Seizure hotspots"
        subtitle="Counties ranked by seizure count for the selected period."
        className="lg:col-span-2"
      >
        {loading && <RowsSkeleton />}
        {!loading && rows.length === 0 && <Empty />}
        {!loading && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((r, i) => {
              const pct = total > 0 ? (r.total_cases / total) * 100 : 0;
              const widthPct = (r.total_cases / max) * 100;
              const isTop3 = i < 3;
              return (
                <li key={r.county ?? `unknown-${i}`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <span className="w-4 text-right tabular-nums text-base-content/40">
                        {i + 1}
                      </span>
                      <MapPin className="size-3 text-base-content/40" aria-hidden="true" />
                      <span className="truncate">{r.county || "Unknown"}</span>
                      {isTop3 && (
                        <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Top
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-base-content/60">
                      {r.total_cases.toLocaleString()}
                      <span className="ml-1.5 text-base-content/40">
                        {pct.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-base-200/70">
                    <div
                      className={
                        "h-full rounded-full transition-all duration-500 " +
                        (isTop3 ? "bg-primary" : "bg-primary/45")
                      }
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      <ChartCard title="Distribution" subtitle="Share of total by county.">
        <ul className="space-y-3">
          {loading && <RowsSkeleton short />}
          {!loading && rows.slice(0, 6).map((r) => {
            const pct = total > 0 ? (r.total_cases / total) * 100 : 0;
            return (
              <li key={r.county} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-base-content/70">
                  {r.county || "Unknown"}
                </span>
                <span className="shrink-0 tabular-nums font-medium">{pct.toFixed(1)}%</span>
              </li>
            );
          })}
          {!loading && rows.length > 6 && (
            <li className="border-t border-base-300/60 pt-3 text-xs text-base-content/50">
              + {rows.length - 6} more counties
            </li>
          )}
        </ul>
      </ChartCard>
    </div>
  );
}

function RowsSkeleton({ short }) {
  const count = short ? 4 : 6;
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-base-200/60" />
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-base-content/50">No data for this period.</p>;
}