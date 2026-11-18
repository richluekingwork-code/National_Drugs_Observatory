import { useEffect, useState } from "react";
import {
  Activity, BedDouble, Building2, ClipboardList, HeartHandshake, RefreshCw,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { mohService } from "../../../services/mohService";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ChartTooltip } from "../../../components/charts/ChartTooltip";
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from "../../../components/charts/chartTheme";
import { YearSelector } from "../../ldea/analytics/YearSelector";

export default function MOHAnalyticsPage() {
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    mohService.dashboard.years()
      .then((list) => {
        setYears(list);
        if (list.length > 0) setYear(list[0]);
      })
      .catch(() => setYears([]));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MOH analytics</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Treatment demand, bed capacity, and prevention reach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelector years={years} value={year} onChange={setYear} />
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="btn btn-ghost btn-sm normal-case gap-1.5 text-base-content/70"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <KPIRow year={year} refreshKey={refreshKey} />
      <TrendRow year={year} refreshKey={refreshKey} />
      <UtilizationRow refreshKey={refreshKey} />
      <PreventionRow year={year} refreshKey={refreshKey} />
    </div>
  );
}

function KPIRow({ year, refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    mohService.dashboard.kpis({ year }).then(setData).catch(() => setData(null));
  }, [year, refreshKey]);

  const KPIS = [
    { key: "admissions",         label: "Admissions",        icon: Activity,       tint: "text-primary" },
    { key: "active_facilities",  label: "Active facilities", icon: Building2,      tint: "text-secondary" },
    { key: "occupancy_rate",     label: "Occupancy rate",    icon: BedDouble,      tint: "text-warning", suffix: "%" },
    { key: "prevention_reports", label: "Prevention reports",icon: HeartHandshake, tint: "text-success" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map(({ key, label, icon: Icon, tint, suffix }) => (
        <div key={key} className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-base-content/50">
              {label}
            </span>
            <span className={`grid size-7 place-items-center rounded-md bg-base-200/70 ${tint}`}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums leading-none">
            {data ? (data[key] ?? 0).toLocaleString() : "—"}
            {suffix && data && <span className="ml-1 text-base text-base-content/60">{suffix}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function TrendRow({ year, refreshKey }) {
  const [counties, setCounties] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    Promise.all([
      mohService.dashboard.admissionsByCounty({ year }),
      mohService.dashboard.admissionsTrend({ year }),
    ])
      .then(([c, t]) => { setCounties(c); setTrend(t); })
      .catch(() => { setCounties([]); setTrend([]); });
  }, [year, refreshKey]);

  const topCounties = counties.slice(0, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Admissions trend" subtitle="Monthly demand-reduction records.">
        <div className="h-[280px] w-full text-base-content">
          {trend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" {...AXIS_PROPS} minTickGap={24} />
                <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                  content={<ChartTooltip />}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Admissions"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      <ChartCard title="Admissions by county" subtitle="Top counties for the selected period.">
        <div className="h-[280px] w-full text-base-content">
          {topCounties.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCounties}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
              >
                <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
                <YAxis type="category" dataKey="county" {...AXIS_PROPS} width={110} />
                <Tooltip
                  cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="count" name="Admissions" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {topCounties.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

function UtilizationRow({ refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    mohService.dashboard.bedUtilization().then(setRows).catch(() => setRows([]));
  }, [refreshKey]);

  return (
    <ChartCard
      title="Bed utilization"
      subtitle="Occupancy across active facilities, ranked by current usage."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-base-content/50">No active facilities reporting beds.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((f) => {
            const over = f.occupancy_rate >= 90;
            return (
              <li key={f.id} className="rounded-[--radius-field] border border-base-300/60 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/moh/facilities/${f.id}`}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {f.facility_name}
                    </Link>
                    <p className="text-xs text-base-content/60">{f.county}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${over ? "text-error" : "text-base-content"}`}>
                    {f.occupancy_rate}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-200/70">
                  <div
                    className={`h-full rounded-full ${over ? "bg-error" : "bg-primary"}`}
                    style={{ width: `${Math.min(f.occupancy_rate, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] tabular-nums text-base-content/55">
                  {f.current_occupancy} of {f.total_beds} beds
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}

function PreventionRow({ year, refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    mohService.dashboard.preventionReach({ year }).then(setRows).catch(() => setRows([]));
  }, [year, refreshKey]);

  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <ChartCard
      title="Prevention activities"
      subtitle="Reports that included each activity type."
    >
      {rows.length === 0 || total === 0 ? (
        <p className="text-sm text-base-content/50">No prevention reports for this period.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r, i) => {
            const pct = total ? (r.count / total) * 100 : 0;
            return (
              <li key={r.activity}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium">{r.activity}</span>
                  <span className="tabular-nums text-base-content/60">
                    {r.count} <span className="text-base-content/40">· {pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-base-200/70">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-xs text-base-content/50">
      No data for this period.
    </div>
  );
}