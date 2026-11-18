import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { UserCheck, ArrowRight, Loader2, User, Search, Filter, Calendar, Scale } from "lucide-react";
import { mojService } from "../../../services/mojService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

export default function MOJWorkloadsPage() {
  const [loading, setLoading] = useState(true);
  const [rawAssignments, setRawAssignments] = useState([]);
  const [rawCases, setRawCases] = useState([]);

  // Filter states
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    async function fetchWorkloads() {
      try {
        const [assignRes, casesRes] = await Promise.all([
          mojService.assignments.list({ page_size: 1000 }),
          mojService.cases.list({ page_size: 1000 })
        ]);

        setRawAssignments(assignRes.data.results || assignRes.data);
        setRawCases(casesRes.data.results || casesRes.data);
      } catch (err) {
        console.error("Failed to load workloads", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkloads();
  }, []);

  // Extract unique years from the cases
  const availableYears = useMemo(() => {
    return [...new Set(
      rawCases.map((c) => c.filing_date?.split("-")[0])
    )].filter(Boolean).sort().reverse();
  }, [rawCases]);

  // Combine and filter the workloads
  const filteredWorkloads = useMemo(() => {
    // 1. Filter the cases first
    let validCases = rawCases.filter((c) => {
      const matchesSearch = 
        (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
        (c.case_number && c.case_number.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCounty = countyFilter ? c.county === countyFilter : true;
      const matchesYear = yearFilter ? c.filing_date?.startsWith(yearFilter) : true;

      return matchesSearch && matchesCounty && matchesYear;
    });

    // SORT CASES: Newest first (highest ID first)
    validCases.sort((a, b) => b.id - a.id);

    const validCaseIds = new Set(validCases.map(c => c.id));
    const caseMap = {};
    validCases.forEach(c => { caseMap[c.id] = c; });

    // 3. Group assignments by prosecutor
    const grouped = {};
    rawAssignments.forEach(assignment => {
      if (!validCaseIds.has(assignment.case)) return; 

      const name = assignment.prosecutor?.trim() || "Unassigned";
      const caseDetails = caseMap[assignment.case];
      
      if (!grouped[name]) {
        grouped[name] = {
          name: name,
          cases: [],
          latestCaseId: 0 // Used to track the newest assignment
        };
      }
      
      grouped[name].cases.push(caseDetails);
      
      // Track the highest ID to figure out who got a case most recently
      if (caseDetails.id > grouped[name].latestCaseId) {
        grouped[name].latestCaseId = caseDetails.id;
      }
    });

    // 4. Convert to array and sort by the most recent assignment
    // If they have the same latest case ID, sort by number of cases
    return Object.values(grouped).sort((a, b) => {
      if (b.latestCaseId !== a.latestCaseId) {
        return b.latestCaseId - a.latestCaseId; 
      }
      return b.cases.length - a.cases.length;
    });
  }, [rawAssignments, rawCases, search, countyFilter, yearFilter]);

  const clearFilters = () => {
    setSearch("");
    setCountyFilter("");
    setYearFilter("");
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-base-content/50">Calculating workloads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="size-6 text-primary" /> Prosecutor Workloads
        </h1>
        <p className="text-sm text-base-content/60">Monitor active case assignments across the Ministry of Justice.</p>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search by case title or number..."
            className="input input-bordered w-full pl-9 h-10 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
            <select
              className={`select select-bordered h-10 pl-8 pr-8 rounded-lg text-sm min-w-[140px] ${
                countyFilter ? "border-primary/50 bg-primary/5 text-primary font-medium" : "text-base-content/70"
              }`}
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
            >
              <option value="">All Counties</option>
              {COUNTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
            <select
              className={`select select-bordered h-10 pl-8 pr-8 rounded-lg text-sm min-w-[120px] ${
                yearFilter ? "border-primary/50 bg-primary/5 text-primary font-medium" : "text-base-content/70"
              }`}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {(search || countyFilter || yearFilter) && (
            <button 
              onClick={clearFilters}
              className="btn btn-ghost btn-sm h-10 text-base-content/60 hover:text-error hover:bg-error/10 px-3"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* WORKLOAD CARDS */}
      {filteredWorkloads.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center shadow-sm">
          <Scale className="size-12 text-base-content/20 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-base-content/70">No matching assignments found</h3>
          <p className="text-sm text-base-content/50 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkloads.map(prosecutor => (
            <div key={prosecutor.name} className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden flex flex-col">
              
              {/* Card Header */}
              <div className="bg-base-200/50 p-5 border-b border-base-300 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-content font-bold text-lg shadow-sm shrink-0">
                  <User className="size-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-base-content truncate">{prosecutor.name}</h2>
                  <p className="text-xs font-semibold text-primary uppercase mt-0.5">
                    {prosecutor.cases.length} {prosecutor.cases.length === 1 ? "Matching Case" : "Matching Cases"}
                  </p>
                </div>
              </div>

              {/* Case List */}
              <div className="p-4 flex-1 space-y-3">
                {prosecutor.cases.map(c => (
                  <div key={c.id} className="p-3 rounded-lg border border-base-200 bg-base-50 flex items-center justify-between group">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-sm truncate text-base-content group-hover:text-primary transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[11px] font-mono text-base-content/60 flex items-center gap-2 mt-0.5">
                        {c.case_number} · {c.county}
                      </p>
                    </div>
                    <Link 
                      to={`/moj/cases/${c.id}`}
                      className="btn btn-circle btn-ghost btn-xs shrink-0 text-base-content/40 hover:text-primary hover:bg-primary/10"
                    >
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}