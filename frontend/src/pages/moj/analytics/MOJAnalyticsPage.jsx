import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Scale, FolderOpen, Gavel, DollarSign, Activity,
  TrendingUp, Calendar, Loader2, Wallet, PieChart as PieIcon,
  BarChart3, MapPin, Tag, ListChecks,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { mojService } from "../../../services/mojService";

/* One colour per meaning, used the same way everywhere: KPI cards, the
   pipeline, the donuts and their legends. */

const COLORS = {
  pending: "#f59e0b",
  investigation: "#3b82f6",
  closed: "#10b981",
  conviction: "#ef4444",
  acquittal: "#10b981",
  dismissal: "#6b7280",
};

// Literal class strings so Tailwind can see them
const TONE = {
  primary: { top: "border-t-primary", chip: "bg-primary/10 text-primary" },
  info: { top: "border-t-info", chip: "bg-info/10 text-info" },
  success: { top: "border-t-success", chip: "bg-success/10 text-success" },
  error: { top: "border-t-error", chip: "bg-error/10 text-error" },
  warning: { top: "border-t-warning", chip: "bg-warning/15 text-warning" },
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/* ---------- primitives ---------- */

function Kpi({ icon: Icon, label, value, hint, tone, valueClass = "" }) {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl border border-t-2 border-base-300 bg-base-100 p-4 shadow-sm ${t.top}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-base-content/55">{label}</p>
          <p className={`mt-1 truncate text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.chip}`}>
          <Icon className="size-5" />
        </span>
      </div>
      {hint && <p className="mt-3 border-t border-base-300/70 pt-2.5 text-xs text-base-content/55">{hint}</p>}
    </div>
  );
}

function Panel({ icon: Icon, title, tone = "primary", action, children }) {
  const t = TONE[tone];
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-base-300 bg-base-200/40 px-4 py-3">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold">
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${t.chip}`}>
            <Icon className="size-4" />
          </span>
          {title}
        </h2>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return <p className="grid h-full min-h-[10rem] place-items-center text-center text-sm text-base-content/45">{children}</p>;
}

// Donut with the total in the middle and a legend underneath
function Donut({ data, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgb(0 0 0 / 0.08)", boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-semibold leading-none tabular-nums">{total}</p>
            <p className="mt-1 text-xs text-base-content/55">{centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-base-300/60 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 py-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
            <span className="text-base-content/80">{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-base-content/50">{pct(d.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Count items by a key, largest first
const tally = (list, keyFn, limit = 8) =>
  Object.entries(
    list.reduce((acc, item) => {
      const k = (keyFn(item) ?? "").toString().trim();
      if (!k) return acc;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

const AXIS = { fill: "#6b7280", fontSize: 12 };
const GRID = "rgb(128 128 128 / 0.18)";
const TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid rgb(0 0 0 / 0.08)",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
    fontSize: 12,
  },
  cursor: { fill: "rgb(128 128 128 / 0.1)" },
};

// Vertical bars over time
function VBars({ data, color, unit }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS} dy={6} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS} width={40} />
          <Tooltip
            {...TOOLTIP}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
            formatter={(v) => [v, unit]}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal ranked bars with the value at the end of each bar
function HBars({ data, color, unit }) {
  const height = Math.max(data.length * 36 + 16, 160);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS} />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            axisLine={false}
            tickLine={false}
            tick={AXIS}
            tickFormatter={(n) => (n.length > 15 ? `${n.slice(0, 14)}…` : n)}
          />
          <Tooltip {...TOOLTIP} formatter={(v) => [v, unit]} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: "#6b7280" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- page ---------- */

export default function MOJAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  // Raw data
  const [cases, setCases] = useState([]);
  const [courtCases, setCourtCases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fines, setFines] = useState([]);
  const [hearings, setHearings] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [caseRes, courtRes, orderRes, fineRes, hearingRes] = await Promise.all([
          mojService.cases.list({ page_size: 1000 }),
          mojService.courtCases.list({ page_size: 1000 }),
          mojService.orders.list({ page_size: 1000 }),
          mojService.fines.list({ page_size: 1000 }),
          mojService.hearings.list({ page_size: 1000 }),
        ]);

        setCases(caseRes.data.results || caseRes.data);
        setCourtCases(courtRes.data.results || courtRes.data);
        setOrders(orderRes.data.results || orderRes.data);
        setFines(fineRes.data.results || fineRes.data);
        setHearings(hearingRes.data.results || hearingRes.data);
      } catch (err) {
        console.error("Analytics fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- CALCULATIONS ---

  // 1. Financials
  const totalFines = fines.reduce((sum, f) => sum + num(f.total_amount), 0);
  const totalOutstanding = fines.reduce((sum, f) => sum + num(f.outstanding_balance), 0);
  const totalCollected = totalFines - totalOutstanding;
  const collectionRate = pct(totalCollected, totalFines);

  // 2. Case pipeline
  const pipeline = [
    { name: "LDEA cases", count: cases.length, color: "#3b82f6" },
    { name: "Filed in court", count: courtCases.length, color: "#8b5cf6" },
    { name: "Judgments", count: orders.length, color: "#10b981" },
  ];
  const pipelineMax = Math.max(cases.length, 1);

  // 3. Case status
  const statusCounts = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = [
    { name: "Pending", value: statusCounts.pending || 0, color: COLORS.pending },
    { name: "Investigation", value: statusCounts.investigation || 0, color: COLORS.investigation },
    { name: "Closed", value: statusCounts.closed || 0, color: COLORS.closed },
  ].filter((d) => d.value > 0);

  // 4. Judgment outcomes
  const outcomeCounts = orders.reduce((acc, o) => {
    acc[o.judgment_type] = (acc[o.judgment_type] || 0) + 1;
    return acc;
  }, {});
  const outcomeData = [
    { name: "Conviction", value: outcomeCounts.conviction || 0, color: COLORS.conviction },
    { name: "Acquittal", value: outcomeCounts.acquittal || 0, color: COLORS.acquittal },
    { name: "Dismissal", value: outcomeCounts.dismissal || 0, color: COLORS.dismissal },
  ].filter((d) => d.value > 0);

  // 5. Upcoming hearings (next 14 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date();
  horizon.setDate(today.getDate() + 14);

  const upcomingHearings = hearings
    .filter((h) => {
      const d = new Date(h.hearing_date);
      return d >= today && d <= horizon && !h.is_adjourned;
    })
    .sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date))
    .slice(0, 5);

  // 6. Bar chart data
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      name: d.toLocaleDateString(undefined, { month: "short" }),
      full: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      value: 0,
    };
  });
  cases.forEach((c) => {
    const m = monthly.find((x) => x.key === c.filing_date?.slice(0, 7));
    if (m) m.value += 1;
  });
  const monthlyTotal = monthly.reduce((sum, m) => sum + m.value, 0);

  const countyData = tally(cases, (c) => c.county, 8);
  const hearingTypeData = tally(hearings, (h) => h.hearing_type, 8);
  const chargeData = tally(cases, (c) => c.charge, 8);

  const inDays = (date) => {
    const n = Math.round((new Date(date) - today) / 86400000);
    return n <= 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 size-8 animate-spin text-primary" />
          <p className="text-sm text-base-content/60">Compiling analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-content shadow-sm">
            <Scale className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">MOJ analytics</h1>
            <p className="text-sm text-base-content/60">
              Overview of the criminal justice pipeline and Ministry performance.
            </p>
          </div>
        </div>
        <span className="rounded-md bg-base-200 px-2.5 py-1 text-xs text-base-content/60">
          As of {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={FolderOpen}
          label="Total cases"
          value={cases.length}
          tone="primary"
          hint="Filed by the LDEA"
        />
        <Kpi
          icon={Gavel}
          label="In court"
          value={courtCases.length}
          tone="info"
          hint={`${pct(courtCases.length, cases.length)}% of LDEA cases`}
        />
        <Kpi
          icon={TrendingUp}
          label="Fines collected"
          value={money(totalCollected)}
          tone="success"
          valueClass="text-success"
          hint={`${collectionRate}% of ${money(totalFines)} issued`}
        />
        <Kpi
          icon={DollarSign}
          label="Outstanding fines"
          value={money(totalOutstanding)}
          tone="error"
          valueClass="text-error"
          hint={`${pct(totalOutstanding, totalFines)}% still unpaid`}
        />
      </div>

      {/* Row 1: pipeline and collections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel icon={Activity} title="Case progression" tone="primary">
            <ul className="space-y-5">
              {pipeline.map((stage, i) => {
                const prev = i === 0 ? null : pipeline[i - 1].count;
                return (
                  <li key={stage.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{stage.name}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold tabular-nums">{stage.count}</span>
                        {prev !== null && (
                          <span className="text-xs text-base-content/50">
                            {pct(stage.count, prev)}% of {pipeline[i - 1].name.toLowerCase()}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-base-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((stage.count / pipelineMax) * 100, stage.count > 0 ? 2 : 0)}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <Panel icon={Wallet} title="Fine collection" tone="success">
          {totalFines === 0 ? (
            <Empty>No fines issued.</Empty>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-base-content/55">Collection rate</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{collectionRate}%</p>
              </div>
              <div
                className="flex h-3 overflow-hidden rounded-full bg-base-200"
                role="img"
                aria-label={`${collectionRate}% of fines collected`}
              >
                <div className="h-full bg-success" style={{ width: `${collectionRate}%` }} />
                <div className="h-full bg-error/70" style={{ width: `${100 - collectionRate}%` }} />
              </div>
              <ul className="divide-y divide-base-300/60 text-sm">
                <li className="flex items-center gap-2.5 py-2">
                  <span className="size-2.5 rounded-full bg-success" aria-hidden />
                  Collected
                  <span className="ml-auto font-medium tabular-nums">{money(totalCollected)}</span>
                </li>
                <li className="flex items-center gap-2.5 py-2">
                  <span className="size-2.5 rounded-full bg-error/70" aria-hidden />
                  Outstanding
                  <span className="ml-auto font-medium tabular-nums">{money(totalOutstanding)}</span>
                </li>
                <li className="flex items-center gap-2.5 py-2 text-base-content/60">
                  <span className="size-2.5 rounded-full border border-base-content/30" aria-hidden />
                  Total issued
                  <span className="ml-auto font-medium tabular-nums">{money(totalFines)}</span>
                </li>
              </ul>
            </div>
          )}
        </Panel>
      </div>

      {/* Row 2: filings over time and by county */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            icon={BarChart3}
            title="Cases filed per month"
            tone="primary"
            action={<span className="text-xs text-base-content/55">Last 12 months · {monthlyTotal} filed</span>}
          >
            {monthlyTotal === 0 ? <Empty>No cases filed in the last 12 months.</Empty> : <VBars data={monthly} color="#3b82f6" unit="Cases" />}
          </Panel>
        </div>

        <Panel icon={MapPin} title="Cases by county" tone="info" action={<span className="text-xs text-base-content/55">Top {Math.min(countyData.length, 8)}</span>}>
          {countyData.length === 0 ? <Empty>No county data.</Empty> : <HBars data={countyData} color="#14b8a6" unit="Cases" />}
        </Panel>
      </div>

      {/* Row 3: three equal panels */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Panel icon={FolderOpen} title="Case status" tone="info">
          {statusData.length === 0 ? <Empty>No case data.</Empty> : <Donut data={statusData} centerLabel="cases" />}
        </Panel>

        <Panel icon={PieIcon} title="Court outcomes" tone="warning">
          {outcomeData.length === 0 ? (
            <Empty>No judgments recorded.</Empty>
          ) : (
            <Donut data={outcomeData} centerLabel="judgments" />
          )}
        </Panel>

        <Panel
          icon={Calendar}
          title="Next 14 days"
          tone="warning"
          action={
            <Link to="/moj/hearings" className="text-xs font-medium text-primary hover:underline">
              View calendar
            </Link>
          }
        >
          {upcomingHearings.length === 0 ? (
            <Empty>No hearings scheduled for the next two weeks.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {upcomingHearings.map((h) => {
                const d = new Date(h.hearing_date);
                return (
                  <li key={h.id} className="flex items-center gap-3 rounded-lg bg-base-200/50 p-2.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-base-300 bg-base-100 text-center leading-none">
                      <div>
                        <p className="text-[10px] font-medium uppercase text-base-content/50">
                          {d.toLocaleDateString(undefined, { month: "short" })}
                        </p>
                        <p className="mt-0.5 text-base font-semibold tabular-nums">{d.getDate()}</p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.hearing_type}</p>
                      <p className="truncate font-mono text-xs text-base-content/55">{h.court_case_number}</p>
                    </div>
                    <span className="shrink-0 rounded bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      {inDays(h.hearing_date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Row 4: hearings by type and top charges */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel icon={ListChecks} title="Hearings by type" tone="warning">
          {hearingTypeData.length === 0 ? <Empty>No hearings recorded.</Empty> : <HBars data={hearingTypeData} color="#8b5cf6" unit="Hearings" />}
        </Panel>

        <Panel icon={Tag} title="Top charges" tone="error">
          {chargeData.length === 0 ? <Empty>No charge data.</Empty> : <HBars data={chargeData} color="#ef4444" unit="Cases" />}
        </Panel>
      </div>
    </div>
  );
}