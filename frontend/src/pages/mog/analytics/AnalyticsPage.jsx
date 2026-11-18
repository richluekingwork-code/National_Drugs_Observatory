import { useEffect, useState } from "react";
import {
  BarChart3, ClipboardCheck, HeartHandshake, Home, Users, RefreshCw,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { mogService } from "../../../services/mogService";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ChartTooltip } from "../../../components/charts/ChartTooltip";
import {
  AXIS_PROPS, CHART_COLORS, GRID_PROPS,
} from "../../../components/charts/chartTheme";
import { YearSelector } from "../../ldea/analytics/YearSelector";

export default function MOGAnalyticsPage() {
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    mogService.dashboard.years()
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
          <h1 className="text-2xl font-semibold tracking-tight">
            MOG analytics
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Caseload, reunification, and timelines across the ministry.
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
      <ReunificationRow year={year} refreshKey={refreshKey} />
      <CaseloadRow year={year} refreshKey={refreshKey} />
      <ActivityTrends year={year} refreshKey={refreshKey} />
    </div>
  );
}


function KPIRow({ year, refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    mogService.dashboard.kpis({ year }).then(setData).catch(() => setData(null));
  }, [year, refreshKey]);

  const KPIS = [
    { key: "assessments", label: "Assessments",  icon: ClipboardCheck, tint: "text-primary" },
    { key: "followups",   label: "Follow-ups",   icon: Home,           tint: "text-secondary" },
    { key: "closures",    label: "Closures",     icon: Users,          tint: "text-warning" },
    { key: "handovers",   label: "Reunifications", icon: HeartHandshake, tint: "text-success" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map(({ key, label, icon: Icon, tint }) => (
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
          </p>
        </div>
      ))}
    </div>
  );
}


function ReunificationRow({ year, refreshKey }) {
  const [rate, setRate] = useState(null);
  const [ttc, setTtc] = useState(null);

  useEffect(() => {
    Promise.all([
      mogService.dashboard.reunificationRate({ year }),
      mogService.dashboard.timeToClosure({ year }),
    ])
      .then(([r, t]) => { setRate(r); setTtc(t); })
      .catch(() => { setRate(null); setTtc(null); });
  }, [year, refreshKey]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Reunification rate"
        subtitle="Share of closed cases that ended in a successful handover."
      >
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-semibold tabular-nums text-primary">
            {rate ? `${rate.rate}%` : "—"}
          </p>
          {rate && (
            <p className="text-sm text-base-content/60">
              {rate.reunified} of {rate.closed} closed
            </p>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-base-200/70">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${rate?.rate ?? 0}%` }}
          />
        </div>
      </ChartCard>

      <ChartCard
        title="Time to closure"
        subtitle="Average days from first assessment to case closure."
      >
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-semibold tabular-nums text-primary">
            {ttc ? ttc.average_weeks : "—"}
          </p>
          <p className="text-sm text-base-content/60">weeks</p>
        </div>
        {ttc && (
          <p className="mt-2 text-xs text-base-content/55">
            {ttc.average_days} days on average across {ttc.sample_size} cases
          </p>
        )}
      </ChartCard>
    </div>
  );
}


function CaseloadRow({ year, refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    mogService.dashboard.caseloadsByCounty({ year })
      .then((d) => setRows(d))
      .catch(() => setRows([]));
  }, [year, refreshKey]);

  const top = rows.slice(0, 10);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ChartCard
      title="Caseload by county"
      subtitle="Assessment counts for the selected period."
    >
      {rows.length === 0 && (
        <p className="text-sm text-base-content/50">No assessments for this period.</p>
      )}
      {rows.length > 0 && (
        <div className="h-[320px] w-full text-base-content">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            >
              <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
              <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="county"
                {...AXIS_PROPS}
                width={110}
              />
              <Tooltip
                cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="count" name="Assessments" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {top.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}


function ActivityTrends({ year, refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    mogService.dashboard.activityTrends({ year })
      .then((d) => setRows(d))
      .catch(() => setRows([]));
  }, [year, refreshKey]);

  const KEYS = [
    { key: "assessments", label: "Assessments",  color: CHART_COLORS[0] },
    { key: "followups",   label: "Follow-ups",   color: CHART_COLORS[1] },
    { key: "tracings",    label: "Tracings",     color: CHART_COLORS[2] },
    { key: "handovers",   label: "Handovers",    color: CHART_COLORS[3] },
  ];

  return (
    <ChartCard
      title="Activity over time"
      subtitle="Monthly counts of assessments, follow-ups, tracings, and handovers."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-base-content/50">No activity recorded.</p>
      ) : (
        <div className="h-[320px] w-full text-base-content">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
            >
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" {...AXIS_PROPS} minTickGap={24} />
              <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                content={<ChartTooltip />}
              />
              {KEYS.map(({ key, label, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-base-300/60 pt-4">
        {KEYS.map(({ key, label, color }) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-base-content/70">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}