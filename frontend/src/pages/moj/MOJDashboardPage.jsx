import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Scale, FolderOpen, Clock, ShieldAlert, CheckCircle, 
  Gavel, Calendar, DollarSign, ArrowRight, Loader2 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { mojService } from "../../services/mojService";

export default function MOJDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [courtCases, setCourtCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fines, setFines] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [caseRes, courtRes, hearingRes, orderRes, fineRes] = await Promise.all([
          mojService.cases.list({ page_size: 1000 }),
          mojService.courtCases.list({ page_size: 1000 }),
          mojService.hearings.list({ page_size: 1000 }),
          mojService.orders.list({ page_size: 1000 }),
          mojService.fines.list({ page_size: 1000 })
        ]);

        setCases(caseRes.data.results || caseRes.data);
        setCourtCases(courtRes.data.results || courtRes.data);
        setHearings(hearingRes.data.results || hearingRes.data);
        setOrders(orderRes.data.results || orderRes.data);
        setFines(fineRes.data.results || fineRes.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // --- CALCULATE KPIS ---
  const totalCases = cases.length;
  const pendingReview = cases.filter(c => c.status === "pending").length;
  const closedCases = cases.filter(c => c.status === "closed").length;
  
  // Upcoming Hearings (Next 30 days)
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  const upcomingHearings = hearings.filter(h => {
    const hDate = new Date(h.hearing_date);
    return hDate >= today && hDate <= nextMonth;
  }).sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date));

  // Fines
  const outstandingFines = fines.filter(f => parseFloat(f.outstanding_balance) > 0);
  const totalOutstanding = outstandingFines.reduce((sum, f) => sum + parseFloat(f.outstanding_balance), 0);

  // Chart Data: Pipeline
  const chartData = [
    { name: "LDEA Cases", count: totalCases, fill: "#3b82f6" },
    { name: "In Court", count: courtCases.length, fill: "#8b5cf6" },
    { name: "Judgments", count: orders.length, fill: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="size-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-base-content/60 font-medium">Generating MOJ Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
          MOJ Command Center
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Overview of the criminal justice pipeline and urgent legal actions.
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-base-content/60">Total Cases Received</p>
              <p className="text-3xl font-bold mt-2">{totalCases}</p>
            </div>
            <div className="grid place-items-center size-12 rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-warning gap-1">
            <Clock className="size-3.5" /> {pendingReview} awaiting initial review
          </div>
        </div>

        <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-base-content/60">Court Filings</p>
              <p className="text-3xl font-bold mt-2">{courtCases.length}</p>
            </div>
            <div className="grid place-items-center size-12 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Gavel className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 gap-1">
            <CheckCircle className="size-3.5" /> {orders.length} judgments recorded
          </div>
        </div>

        <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-base-content/60">Upcoming Hearings</p>
              <p className="text-3xl font-bold mt-2">{upcomingHearings.length}</p>
            </div>
            <div className="grid place-items-center size-12 rounded-xl bg-warning/10 text-warning">
              <Calendar className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-base-content/60 gap-1">
            Scheduled for the next 30 days
          </div>
        </div>

        <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-base-content/60">Outstanding Fines</p>
              <p className="text-3xl font-bold mt-2">${totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="grid place-items-center size-12 rounded-xl bg-error/10 text-error">
              <DollarSign className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-error gap-1">
            Across {outstandingFines.length} unpaid judgments
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART PANEL */}
        <div className="lg:col-span-2 rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Scale className="size-5 text-primary" /> Case Progression Pipeline
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* URGENT HEARINGS LIST */}
        <div className="lg:col-span-1 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col">
          <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-50/50 rounded-t-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="size-5 text-warning" /> Next 30 Days
            </h2>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[320px]">
            {upcomingHearings.length === 0 ? (
              <div className="text-center py-8 text-base-content/50 text-sm">
                No upcoming hearings scheduled.
              </div>
            ) : (
              upcomingHearings.slice(0, 5).map(h => (
                <div key={h.id} className="p-3 rounded-xl border border-base-200 bg-base-50 hover:bg-base-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm">{h.hearing_type}</p>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {new Date(h.hearing_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 mt-1">Case: {h.court_case_number}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-base-200 mt-auto">
            <Link to="/moj/cases" className="btn btn-ghost btn-sm w-full text-primary hover:bg-primary/10">
              View Case Register <ArrowRight className="size-4 ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}