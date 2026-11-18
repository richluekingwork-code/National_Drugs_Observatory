import { useEffect, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ChartTooltip } from "../../../components/charts/ChartTooltip";
import { AXIS_PROPS, GRID_PROPS } from "../../../components/charts/chartTheme";
import { ldeaService } from "../../../services/ldeaService";

const RANGE_OPTIONS = [
  { id: "all",     label: "All" },
  { id: "recent",  label: "Recent" },
];

export function EffectivenessPanel({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ldeaService.dashboard.effectiveness({ year })
      .then((d) => !cancelled && setRows(d))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [year]);

  const visible = range === "recent" ? rows.slice(-30) : rows;

  const stats = summarize(rows);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Arrest effectiveness"
        subtitle="Average score per day — transferred 100, detained 50, released 0."
        className="lg:col-span-2"
        actions={
          <div className="inline-flex rounded-full border border-base-300 bg-base-100 p-0.5 text-[11px]">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={
                  "rounded-full px-2.5 py-1 transition-colors " +
                  (range === r.id
                    ? "bg-base-200 font-medium text-base-content"
                    : "text-base-content/60 hover:text-base-content")
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-[320px] w-full text-base-content">
          {loading && <ChartSkeleton />}
          {!loading && visible.length === 0 && <ChartEmpty />}
          {!loading && visible.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="effFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="oklch(0.55 0.19 272)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.55 0.19 272)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  dataKey="date"
                  {...AXIS_PROPS}
                  tickFormatter={shortDate}
                  minTickGap={40}
                />
                <YAxis
                  {...AXIS_PROPS}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}`}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                  content={
                    <ChartTooltip
                      labelFormatter={longDate}
                      valueFormatter={(v) => `${v} / 100`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Effectiveness"
                  stroke="oklch(0.55 0.19 272)"
                  strokeWidth={2}
                  fill="url(#effFill)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      <ChartCard title="Summary" subtitle="Across the selected period.">
        <dl className="space-y-4">
          <Stat label="Average" value={stats.avg != null ? `${stats.avg}` : "—"} suffix="/ 100" />
          <Stat label="Peak day" value={stats.peak ? `${stats.peak.score}` : "—"} suffix={stats.peak ? shortDate(stats.peak.date) : ""} />
          <Stat label="Arrests counted" value={stats.total != null ? stats.total.toLocaleString() : "—"} />
          <Stat
            label="Trend"
            value={stats.trend == null ? "—" : `${stats.trend > 0 ? "+" : ""}${stats.trend}%`}
            tone={stats.trend > 0 ? "up" : stats.trend < 0 ? "down" : "flat"}
          />
        </dl>
      </ChartCard>
    </div>
  );
}

function Stat({ label, value, suffix, tone = "neutral" }) {
  const toneCls =
    tone === "up" ? "text-success" : tone === "down" ? "text-error" : "text-base-content";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-base-content/55">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${toneCls}`}>
        {value}
        {suffix && (
          <span className="ml-1.5 text-xs font-normal text-base-content/50">{suffix}</span>
        )}
      </dd>
    </div>
  );
}

function summarize(rows) {
  if (!rows.length) return { avg: null, peak: null, total: null, trend: null };
  const avg = rows.reduce((s, r) => s + r.score, 0) / rows.length;
  const peak = rows.reduce((a, b) => (b.score > a.score ? b : a), rows[0]);
  const total = rows.reduce((s, r) => s + r.count, 0);

  // Trend: compare first half average to second half average.
  let trend = null;
  if (rows.length >= 4) {
    const mid = Math.floor(rows.length / 2);
    const first = rows.slice(0, mid);
    const last = rows.slice(mid);
    const avgOf = (arr) => arr.reduce((s, r) => s + r.score, 0) / arr.length;
    const f = avgOf(first);
    const l = avgOf(last);
    if (f > 0) trend = Math.round(((l - f) / f) * 100);
  }
  return { avg: avg.toFixed(1), peak, total, trend };
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function longDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function ChartSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-[--radius-field] bg-base-200/60" />;
}

function ChartEmpty() {
  return (
    <div className="grid h-full place-items-center text-xs text-base-content/50">
      No data for this period.
    </div>
  );
}