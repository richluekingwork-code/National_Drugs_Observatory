import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin, TrendingUp, RefreshCw } from "lucide-react";
import { ldeaService } from "../../../services/ldeaService";
import { YearSelector } from "./YearSelector";
import { KpiStrip } from "./KpiStrip";
import { TabBar } from "./TabBar";
import { EffectivenessPanel } from "./EffectivenessPanel";
import { HotspotsPanel } from "./HotspotsPanel";
import { TraffickingPanel } from "./TraffickingPanel";

const TABS = [
  { id: "effectiveness", label: "Effectiveness", icon: Activity },
  { id: "hotspots",      label: "Hotspots",      icon: MapPin },
  { id: "trafficking",   label: "Trafficking",   icon: TrendingUp },
];

export default function AnalyticsPage() {
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(null);
  const [tab, setTab] = useState("effectiveness");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ldeaService.dashboard.years()
      .then((list) => {
        setYears(list);
        if (!year && list.length > 0) setYear(list[0]);
      })
      .catch(() => setYears([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Trends across arrests, seizures, and substance movement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelector years={years} value={year} onChange={setYear} />
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="btn btn-ghost btn-sm normal-case gap-1.5 text-base-content/70"
            aria-label="Refresh data"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <KpiStrip year={year} refreshKey={refreshKey} />

      {/* Tabs + panel */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <div key={`${tab}-${year}-${refreshKey}`}>
        {tab === "effectiveness" && <EffectivenessPanel year={year} />}
        {tab === "hotspots" && <HotspotsPanel year={year} />}
        {tab === "trafficking" && <TraffickingPanel year={year} />}
      </div>
    </div>
  );
}