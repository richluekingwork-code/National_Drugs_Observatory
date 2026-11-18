// frontend/src/pages/moys/Beneficiary/BeneficiariesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Users, ChevronRight, ChevronLeft, Filter, MapPin } from "lucide-react";
import { moysService } from "../../../services/moysService";

const initialsOf = (p) =>
  [p.first_name, p.last_name].filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function MOYSBeneficiariesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Filter States
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterYear, setFilterYear] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    moysService.persons({ page_size: 100 })
      .then((res) => {
        if (cancelled) return;
        setRows(Array.isArray(res?.results) ? res.results : []);
        setTotal(res?.count ?? 0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.detail || e.message || "Failed to load people.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Extract unique counties and years for the dropdown filters
  const counties = useMemo(() => [...new Set(rows.map((r) => r.county_resident).filter(Boolean))].sort(), [rows]);
  const years = useMemo(() => {
    const y = rows.map((r) => r.incident_date ? new Date(r.incident_date).getFullYear() : null).filter(Boolean);
    return [...new Set(y)].sort((a, b) => b - a);
  }, [rows]);

  // Apply all filters
  const filtered = useMemo(() => {
    return rows.filter((p) => {
      // Search (Name)
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ").toLowerCase();
        if (!name.includes(q)) return false;
      }
      // Gender
      if (filterGender && p.gender !== filterGender) return false;
      
      // County
      if (filterCounty && p.county_resident !== filterCounty) return false;

      // Year (from incident_date)
      if (filterYear) {
        const y = p.incident_date ? new Date(p.incident_date).getFullYear().toString() : "";
        if (y !== filterYear) return false;
      }

      return true;
    });
  }, [rows, search, filterGender, filterCounty, filterYear]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterGender, filterCounty, filterYear]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const inputCls = "rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-content shadow-sm">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">MOYS Beneficiaries</h1>
            <p className="text-sm text-base-content/60">Every beneficiary you can work with.</p>
          </div>
        </div>
        <span className="rounded-md bg-base-200 px-2.5 py-1 text-xs text-base-content/60">
          {filtered.length} of {total} {total === 1 ? "person" : "people"}
        </span>
      </div>

      {loading && <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60"><Loader2 className="size-4 animate-spin" /> Loading LDEA people…</div>}
      {!loading && error && <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
          
          {/* Toolbar: Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-base-300 bg-base-200/20">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" className={`${inputCls} w-full pl-9`} />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="size-4 text-base-content/40" />
              
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={inputCls}>
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} className={inputCls}>
                <option value="">All Counties</option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={inputCls}>
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-base-200/50 text-xs uppercase tracking-wider text-base-content/60 border-b border-base-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">County</th>
                  <th className="px-6 py-4 font-semibold">Substance & Rehab</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/60">
                {currentRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-base-content/50">No beneficiaries match your filters.</td></tr>
                ) : (
                  currentRows.map((p) => (
                    <tr key={p.id ?? p.person_id} className="hover:bg-base-200/30 transition-colors">
                      
                      {/* 1. Name & Age / Gender */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary border border-base-300">
                            {p.photo && <img src={p.photo} alt="" className="absolute inset-0 size-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                            <span className="z-0">{initialsOf(p)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-base-content">
                              {[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")}
                            </p>
                            <p className="text-xs text-base-content/60 mt-0.5 capitalize">
                              {p.age != null ? `${p.age} yrs` : "—"} / {p.gender || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. County & Address */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-base-content">{p.county_resident || "—"}</p>
                        <p className="text-xs text-base-content/60 mt-0.5 truncate max-w-[200px]" title={p.address}>
                          {p.address || "—"}
                        </p>
                      </td>

                      {/* 3. Primary Drug / Dependency / Rehab History (Stacked) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex gap-2">
                            <span className="text-base-content/50 w-16">Drug:</span>
                            <span className="font-medium text-base-content/80 truncate max-w-[150px]">{p.type_of_drug_used || "—"}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-base-content/50 w-16">Dependency:</span>
                            <span className="font-medium text-base-content/80 capitalize">{p.dependency_level || "—"}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-base-content/50 w-16">Rehab:</span>
                            <span className="font-medium text-base-content/80">{p.rehab_history ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Action */}
                      <td className="px-6 py-4 text-right align-middle">
                        <Link to={`/moys/people/${p.person_id}`} className="inline-flex items-center gap-1 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium text-primary hover:bg-base-300 transition-colors">
                          View Profile <ChevronRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-base-300 bg-base-100">
              <div className="text-xs text-base-content/60">
                Showing <span className="font-medium text-base-content">{indexOfFirstRow + 1}</span> to <span className="font-medium text-base-content">{Math.min(indexOfLastRow, filtered.length)}</span> of <span className="font-medium text-base-content">{filtered.length}</span> entries
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="inline-flex items-center gap-1 rounded-md border border-base-300 px-3 py-1.5 text-xs font-medium hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="size-3" /> Prev
                </button>
                <span className="text-xs text-base-content/60 px-2">Page <span className="font-medium text-base-content">{currentPage}</span> of {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="inline-flex items-center gap-1 rounded-md border border-base-300 px-3 py-1.5 text-xs font-medium hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}