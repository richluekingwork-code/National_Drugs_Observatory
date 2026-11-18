import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, Scale, Loader2, Search, Filter, Calendar,
  FolderOpen, Clock, ShieldAlert, CheckCircle, X,
} from "lucide-react";
import { mojService } from "../../../services/mojService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

/* Status colour is the one signal that carries through the page: the stat
   cards, the table chips and the row dots all use the same mapping. */

const STATUS = {
  pending: { chip: "bg-warning/15 text-warning", dot: "bg-warning" },
  investigation: { chip: "bg-info/10 text-info", dot: "bg-info" },
  closed: { chip: "bg-success/10 text-success", dot: "bg-success" },
};
const STATUS_NONE = { chip: "bg-base-200 text-base-content/60", dot: "bg-base-content/30" };

// Literal class strings so Tailwind can see them
const TONE = {
  primary: { top: "border-t-primary", chip: "bg-primary/10 text-primary" },
  warning: { top: "border-t-warning", chip: "bg-warning/15 text-warning" },
  info: { top: "border-t-info", chip: "bg-info/10 text-info" },
  success: { top: "border-t-success", chip: "bg-success/10 text-success" },
};

function StatCard({ icon: Icon, label, value, tone }) {
  const t = TONE[tone];
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-t-2 border-base-300 bg-base-100 p-4 shadow-sm ${t.top}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.chip}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-base-content/55">{label}</p>
        <p className="text-2xl font-semibold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
};

const TH = "whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold normal-case tracking-normal text-base-content/60";

export default function MOJCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await mojService.cases.list();
        setCases(res.data.results || []);
      } catch (err) {
        console.error("Failed to load cases", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  // --- STATS ---
  const totalCases = cases.length;
  const pendingCases = cases.filter((c) => c.status === "pending").length;
  const investigationCases = cases.filter((c) => c.status === "investigation").length;
  const closedCases = cases.filter((c) => c.status === "closed").length;

  // Unique years
  const availableYears = [...new Set(cases.map((c) => c.filing_date?.split("-")[0]))]
    .filter(Boolean)
    .sort()
    .reverse();

  // --- FILTERING ---
  const filteredCases = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.case_number && c.case_number.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.charge && c.charge.toLowerCase().includes(q));

    const matchesCounty = countyFilter
      ? c.county?.toLowerCase() === countyFilter.toLowerCase()
      : true;

    const matchesYear = yearFilter ? c.filing_date?.startsWith(yearFilter) : true;

    return matchesSearch && matchesCounty && matchesYear;
  });

  const hasFilters = search || countyFilter || yearFilter;
  const clearFilters = () => {
    setSearch("");
    setCountyFilter("");
    setYearFilter("");
  };

  const selectBase =
    "select select-bordered h-10 min-h-0 rounded-lg pl-8 pr-8 text-sm";
  const selectActive = "border-primary/50 bg-primary/5 font-medium text-primary";
  const selectIdle = "text-base-content/70";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-content shadow-sm">
          <Scale className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Case management</h1>
          <p className="text-sm text-base-content/60">Review and update cases filed by the LDEA.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderOpen} label="Total cases" value={totalCases} tone="primary" />
        <StatCard icon={Clock} label="Pending at MOJ" value={pendingCases} tone="warning" />
        <StatCard icon={ShieldAlert} label="Investigation" value={investigationCases} tone="info" />
        <StatCard icon={CheckCircle} label="Closed" value={closedCases} tone="success" />
      </div>

      {/* Table card with the filters attached to it */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-base-300 bg-base-200/40 p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by case number, title or charge"
              className="input input-bordered h-10 w-full rounded-lg pl-9 text-sm focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-base-content/40" />
              <select
                className={`${selectBase} min-w-[150px] ${countyFilter ? selectActive : selectIdle}`}
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
              >
                <option value="">All counties</option>
                {COUNTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-base-content/40" />
              <select
                className={`${selectBase} min-w-[130px] ${yearFilter ? selectActive : selectIdle}`}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm h-10 gap-1 px-3 text-base-content/60 hover:bg-error/10 hover:text-error"
              >
                <X className="size-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table w-full min-w-[860px]">
            <thead className="bg-base-200/60">
              <tr className="border-b border-base-300">
                <th className={TH}>Case no.</th>
                <th className={`${TH} w-[28%]`}>Title</th>
                <th className={`${TH} w-[16%]`}>Charge</th>
                <th className={TH}>County</th>
                <th className={TH}>Filed</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="mx-auto mb-2 size-7 animate-spin text-primary" />
                    <p className="text-sm text-base-content/50">Loading cases…</p>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="mb-3 inline-grid size-12 place-items-center rounded-full bg-base-200">
                      <Scale className="size-6 text-base-content/40" />
                    </span>
                    <p className="text-base font-semibold text-base-content/70">No cases found</p>
                    <p className="mt-1 text-sm text-base-content/50">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const s = STATUS[c.status] ?? STATUS_NONE;
                  const dash = <span className="text-base-content/30">—</span>;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/moj/cases/${c.id}`)}
                      className="group cursor-pointer border-b border-base-300/60 transition-colors last:border-b-0 hover:bg-base-200/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <Link
                          to={`/moj/cases/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {c.case_number}
                        </Link>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <p className="line-clamp-2 text-sm font-medium" title={c.title}>
                          {c.title}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-middle text-sm text-base-content/80">
                        <span className="line-clamp-2" title={c.charge}>
                          {c.charge || dash}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-base-content/80">
                        {c.county || dash}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle text-sm tabular-nums text-base-content/80">
                        {fmtDate(c.filing_date) ?? dash}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize ${s.chip}`}
                        >
                          <span className={`size-1.5 rounded-full ${s.dot}`} />
                          {c.status_display}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                        <Link
                          to={`/moj/cases/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-outline btn-primary btn-sm gap-1.5"
                        >
                          <Eye className="size-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && cases.length > 0 && (
          <div className="border-t border-base-300 bg-base-200/40 px-4 py-2.5 text-sm text-base-content/55">
            Showing {filteredCases.length} of {totalCases} {totalCases === 1 ? "case" : "cases"}
          </div>
        )}
      </div>
    </div>
  );
}