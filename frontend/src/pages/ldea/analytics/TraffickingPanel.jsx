import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ChartTooltip } from "../../../components/charts/ChartTooltip";
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from "../../../components/charts/chartTheme";
import { ldeaService } from "../../../services/ldeaService";

export function TraffickingPanel({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ldeaService.dashboard.traffickedDrugs({ year }),
      ldeaService.seizures.list({ page: 1, year: year ?? undefined }),
    ])
      .then(([drugs, seizures]) => {
        if (cancelled) return;
        setRows({ drugs, seizures: seizures.results ?? [] });
      })
      .catch(() => !cancelled && setRows({ drugs: [], seizures: [] }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [year]);

  // Build a multi-series time view: one line per drug, x-axis = month.
  const series = useMemo(() => buildSeries(rows), [rows]);
  const visibleDrugs = series.drugs.filter((d) => !hidden.has(d));

  function toggleDrug(name) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Trafficking over time"
        subtitle="Monthly seizure counts by substance. Click a legend item to toggle."
        className="lg:col-span-2"
      >
        <div className="h-[320px] w-full text-base-content">
          {loading && <Skeleton />}
          {!loading && series.drugs.length === 0 && <Empty />}
          {!loading && series.drugs.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={24} />
                <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                  content={<ChartTooltip />}
                />
                {series.drugs.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    hide={hidden.has(name)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {!loading && series.drugs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-base-300/60 pt-4">
            {series.drugs.map((name, i) => {
              const isHidden = hidden.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDrug(name)}
                  aria-pressed={!isHidden}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
                    (isHidden
                      ? "border-base-300 text-base-content/45"
                      : "border-transparent bg-base-200/70 text-base-content/80")
                  }
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                      opacity: isHidden ? 0.3 : 1,
                    }}
                  />
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </ChartCard>

      <ChartCard title="Most seized" subtitle="Total counts and quantities.">
        {loading && <Skeleton />}
        {!loading && rows.drugs?.length === 0 && <Empty />}
        {!loading && rows.drugs?.length > 0 && (
          <ul className="divide-y divide-base-300/60">
            {rows.drugs.slice(0, 8).map((d, i) => (
              <li key={d.drug_type__id ?? i} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {d.drug_type__name || "Unknown"}
                  </span>
                  <span className="block text-xs text-base-content/55">
                    {Number(d.total_quantity ?? 0).toLocaleString()} units
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-sm font-semibold">
                  {d.total_cases}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

function buildSeries(rows) {
  const seizures = rows.seizures ?? [];
  const drugCounts = new Map();

  for (const s of seizures) {
    const name = s.drug_type?.name || "Unknown";
    drugCounts.set(name, (drugCounts.get(name) ?? 0) + 1);
  }

  // Top 6 drugs by count.
  const drugs = [...drugCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  // Bucket seizures by month.
  const buckets = new Map(); // "YYYY-MM" -> { label, [drug]: count }
  for (const s of seizures) {
    if (!s.seizure_date) continue;
    const key = s.seizure_date.slice(0, 7);
    if (!buckets.has(key)) {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      buckets.set(key, { key, label, ...Object.fromEntries(drugs.map((d) => [d, 0])) });
    }
    const name = s.drug_type?.name || "Unknown";
    if (drugs.includes(name)) buckets.get(key)[name] += 1;
  }

  const points = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  return { drugs, points };
}

function Skeleton() {
  return <div className="h-full w-full animate-pulse rounded-[--radius-field] bg-base-200/60" />;
}

function Empty() {
  return (
    <div className="grid h-full place-items-center text-xs text-base-content/50">
      No data for this period.
    </div>
  );
}