import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Banknote, Search, ArrowRight, Loader2, 
  AlertCircle, CheckCircle, Clock, Scale 
} from "lucide-react";
import { mojService } from "../../../services/mojService";

export default function MOJFinesPage() {
  const [loading, setLoading] = useState(true);
  const [fines, setFines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [courtCases, setCourtCases] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchFines() {
      try {
        const [finesRes, ordersRes, courtRes] = await Promise.all([
          mojService.fines.list({ page_size: 1000 }),
          mojService.orders.list({ page_size: 1000 }),
          mojService.courtCases.list({ page_size: 1000 })
        ]);

        setFines(finesRes.data.results || finesRes.data);
        setOrders(ordersRes.data.results || ordersRes.data);
        setCourtCases(courtRes.data.results || courtRes.data);
      } catch (err) {
        console.error("Failed to load fines", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFines();
  }, []);

  // Map data together
  const enrichedFines = useMemo(() => {
    return fines.map(fine => {
      const order = orders.find(o => o.id === fine.court_order);
      const courtCase = order ? courtCases.find(c => c.id === order.court_case) : null;
      
      return {
        ...fine,
        caseNumber: courtCase ? courtCase.court_case_number : `Order #${fine.court_order}`,
        originalCaseId: courtCase ? courtCase.original_case : null,
        dateIssued: order ? order.date_issued : null
      };
    }).sort((a, b) => b.id - a.id); // Newest first
  }, [fines, orders, courtCases]);

  // Calculate KPIs
  const totalFines = enrichedFines.reduce((sum, f) => sum + parseFloat(f.total_amount), 0);
  const totalOutstanding = enrichedFines.reduce((sum, f) => sum + parseFloat(f.outstanding_balance), 0);
  const totalCollected = totalFines - totalOutstanding;

  // Filter
  const filteredFines = enrichedFines.filter(f => 
    f.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-base-content/50">Loading financial records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Banknote className="size-6 text-primary" /> Fine Management
        </h1>
        <p className="text-sm text-base-content/60">Monitor court-imposed fines and outstanding balances.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Total Fines Imposed</p>
            <p className="text-2xl font-bold mt-1 text-base-content">
              ${totalFines.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-lg bg-base-200 text-base-content">
            <Scale className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold mt-1 text-success">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-lg bg-success/10 text-success">
            <CheckCircle className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Outstanding Balance</p>
            <p className="text-2xl font-bold mt-1 text-error">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-lg bg-error/10 text-error">
            <AlertCircle className="size-5" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm flex items-center gap-2">
        <Search className="size-5 text-base-content/50 ml-2" />
        <input
          type="text"
          placeholder="Search by Court Case Number..."
          className="input w-full h-10 rounded-lg text-sm border-none focus:outline-none focus:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FINES TABLE */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th className="text-xs uppercase text-base-content/60">Court Case</th>
                <th className="text-xs uppercase text-base-content/60">Date Issued</th>
                <th className="text-xs uppercase text-base-content/60 text-right">Total Fine</th>
                <th className="text-xs uppercase text-base-content/60 text-right">Paid</th>
                <th className="text-xs uppercase text-base-content/60 text-right">Outstanding</th>
                <th className="text-xs uppercase text-base-content/60 text-center">Status</th>
                <th className="text-xs uppercase text-base-content/60 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-base-content/50">
                    No fines found.
                  </td>
                </tr>
              ) : (
                filteredFines.map(fine => {
                  const paid = parseFloat(fine.total_amount) - parseFloat(fine.outstanding_balance);
                  const isPaid = parseFloat(fine.outstanding_balance) <= 0;
                  
                  return (
                    <tr key={fine.id} className="hover:bg-base-200/30 transition-colors group">
                      <td>
                        <span className="font-mono text-sm font-semibold">{fine.caseNumber}</span>
                      </td>
                      <td>
                        <span className="text-sm">{fine.dateIssued || "—"}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm font-semibold">{fine.currency} {parseFloat(fine.total_amount).toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm text-success">{fine.currency} {paid.toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <span className={`text-sm font-bold ${isPaid ? "text-base-content/50" : "text-error"}`}>
                          {fine.currency} {parseFloat(fine.outstanding_balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center">
                        {isPaid ? (
                          <span className="badge badge-sm badge-success gap-1"><CheckCircle className="size-3"/> Paid</span>
                        ) : (
                          <span className="badge badge-sm badge-error gap-1"><Clock className="size-3"/> Unpaid</span>
                        )}
                      </td>
                      <td className="text-right">
                        {fine.originalCaseId ? (
                          <Link 
                            to={`/moj/cases/${fine.originalCaseId}`}
                            className="btn btn-primary btn-xs btn-outline gap-1 group-hover:bg-primary group-hover:text-primary-content transition-all"
                          >
                            View Case <ArrowRight className="size-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-base-content/40">No Case Linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}