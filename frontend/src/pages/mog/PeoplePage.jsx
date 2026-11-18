// frontend/src/pages/mog/PeoplePage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Users, ChevronRight, ChevronLeft, Filter } from "lucide-react";
import { mogService } from "../../services/mogService";

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const initialsOf = (p) =>
  [p.first_name, p.last_name]
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export default function MOGPeoplePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Filter States
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    mogService
      .persons({ page_size: 100 })
      .then((res) => {
        if (cancelled) return;
        setRows(Array.isArray(res?.results) ? res.results : []);
        setTotal(res?.count ?? 0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.detail || e.message || "Failed to load people.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive filter options dynamically
  const counties = useMemo(() => [...new Set(rows.map((r) => r.county_resident).filter(Boolean))].sort(), [rows]);
  const years = useMemo(() => {
    const y = rows.map((r) => r.incident_date ? new Date(r.incident_date).getFullYear() : null).filter(Boolean);
    return [...new Set(y)].sort((a, b) => b - a);
  }, [rows]);

  // Apply all filters
  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ").toLowerCase();
        if (!name.includes(q)) return false;
      }
      if (filterGender && p.gender !== filterGender) return false;
      if (filterCounty && p.county_resident !== filterCounty) return false;
      if (filterYear) {
        const y = p.incident_date ? new Date(p.incident_date).getFullYear().toString() : "";
        if (y !== filterYear) return false;
      }
      if (filterAge) {
        const age = p.age;
        if (age == null) return false;
        if (filterAge === "child" && age >= 18) return false;
        if (filterAge === "adult" && (age < 18 || age >= 60)) return false;
        if (filterAge === "senior" && age < 60) return false;
      }
      return true;
    });
  }, [rows, search, filterGender, filterCounty, filterAge, filterYear]);

  useEffect(() => { setCurrentPage(1); }, [search, filterGender, filterCounty, filterAge, filterYear]);

  // Pagination Calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const inputCls = "rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-content shadow-sm">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Beneficiaries</h1>
            <p className="text-sm text-base-content/60">Every beneficiary you can work with.</p>
          </div>
        </div>
        <span className="rounded-md bg-base-200 px-2.5 py-1 text-xs text-base-content/60">
          {filtered.length} of {total} {total === 1 ? "person" : "people"}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60">
          <Loader2 className="size-4 animate-spin" /> Loading LDEA people…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* ===== MAIN TABLE CARD ===== */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
          
          {/* Toolbar: Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-base-300 bg-base-200/20">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className={`${inputCls} w-full pl-9`}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="size-4 text-base-content/40" />
              
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={inputCls}>
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} className={inputCls}>
                <option value="">All Counties</option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={filterAge} onChange={(e) => setFilterAge(e.target.value)} className={inputCls}>
                <option value="">All Ages</option>
                <option value="child">Child (&lt;18)</option>
                <option value="adult">Adult (18-59)</option>
                <option value="senior">Senior (60+)</option>
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
                  <th className="px-6 py-4 font-semibold">Gender</th>
                  <th className="px-6 py-4 font-semibold">Age</th>
                  <th className="px-6 py-4 font-semibold">County</th>
                  <th className="px-6 py-4 font-semibold">Incident Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/60">
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-base-content/50">
                      No beneficiaries match your filters.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((p) => (
                    <tr key={p.id ?? p.person_id} className="hover:bg-base-200/30 transition-colors">
                      
                      {/* Name & Avatar */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar Container */}
                          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary border border-base-300">
                            {/* 1. Render Image if the person has a photo URL */}
                            {p.photo ? (
                              <img 
                                src={p.photo} 
                                alt={p.first_name} 
                                className="size-full object-cover" 
                                onError={(e) => { 
                                  // 2. If the image is broken (404), hide the img tag and show the initials underneath
                                  e.currentTarget.style.display = "none"; 
                                  e.currentTarget.nextElementSibling.style.display = "flex"; 
                                }} 
                              />
                            ) : null}
                            
                            {/* 3. Initials (shown by default if no photo, or if the image fails to load) */}
                            <span 
                              className="items-center justify-center size-full" 
                              style={{ display: p.photo ? "none" : "flex" }}
                            >
                              {initialsOf(p)}
                            </span>
                          </div>

                          <div>
                            <p className="font-medium text-base-content">
                              {[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")}
                            </p>
                            <p className="font-mono text-[10px] text-base-content/50 mt-0.5">
                              {p.person_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3 capitalize text-base-content/80">
                        {p.gender || "—"}
                      </td>

                      <td className="px-6 py-3 text-base-content/80">
                        {p.age != null ? `${p.age} yrs` : "—"}
                      </td>

                      <td className="px-6 py-3 text-base-content/80">
                        {p.county_resident || "—"}
                      </td>

                      <td className="px-6 py-3 text-base-content/80">
                        {fmtDate(p.incident_date)}
                      </td>

                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/mog/people/${p.person_id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium text-primary hover:bg-base-300 transition-colors"
                        >
                          View Profile <ChevronRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===== PAGINATION FOOTER ===== */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-base-300 bg-base-100">
              <div className="text-xs text-base-content/60">
                Showing <span className="font-medium text-base-content">{indexOfFirstRow + 1}</span> to{" "}
                <span className="font-medium text-base-content">
                  {Math.min(indexOfLastRow, filtered.length)}
                </span>{" "}
                of <span className="font-medium text-base-content">{filtered.length}</span> entries
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-md border border-base-300 px-3 py-1.5 text-xs font-medium hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="size-3" /> Prev
                </button>
                
                <span className="text-xs text-base-content/60 px-2">
                  Page <span className="font-medium text-base-content">{currentPage}</span> of {totalPages || 1}
                </span>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-base-300 px-3 py-1.5 text-xs font-medium hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
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