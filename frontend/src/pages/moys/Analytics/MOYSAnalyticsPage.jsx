// frontend/src/pages/moys/Analytics/MOYSAnalyticsPage.jsx
import { useEffect, useState, useMemo } from "react";
import { 
  Loader2, BarChart3, FileText, FileCheck, Activity, 
  GraduationCap, ClipboardList, Briefcase, HeartHandshake, 
  User, Users, CheckCircle, TrendingUp, Award, MapPin, Clock, ShieldCheck, PieChart as PieIcon, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { moysService } from "../../../services/moysService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const MODELS = [
  { key: "referrals", label: "Referrals", icon: FileText, endpoint: "referrals", statusField: "referral_status", chartField: "referral_source", chartTitle: "Referrals by Source" },
  { key: "receipts", label: "Receipts", icon: FileCheck, endpoint: "receipts", statusField: "disposition", chartField: "reason_for_referral", chartTitle: "Receipts by Reason" },
  { key: "preTreatment", label: "Pre-Treatment", icon: Activity, endpoint: "preTreatment", statusField: "proposed_mys_intervention", chartField: "treatment_rehabilitation_facility", chartTitle: "Facilities" },
  { key: "aryep", label: "ARYEP Registration", icon: GraduationCap, endpoint: "aryep", statusField: "referral_source", chartField: "programme_site", chartTitle: "Enrollment by Site" },
  { key: "plans", label: "Reintegration Plans", icon: ClipboardList, endpoint: "plans", statusField: "mys_officer_case_manager", chartField: "primary_goal", chartTitle: "Plans by Goal" },
  { key: "tvet", label: "TVET / Skills", icon: Briefcase, endpoint: "tvet", statusField: "completed_training", chartField: "trade", chartTitle: "Enrollment by Trade" },
  { key: "interventions", label: "Interventions", icon: HeartHandshake, endpoint: "interventions", statusField: "completion_status", chartField: "intervention_type", chartTitle: "Interventions by Type" },
  { key: "employment", label: "Employment", icon: Briefcase, endpoint: "employment", statusField: "employment_status", chartField: "employment_sector", chartTitle: "Employment by Sector" },
  { key: "familyReintegration", label: "Family Reintegration", icon: User, endpoint: "familyReintegration", statusField: "family_reunification_status", chartField: "accepted_by_family", chartTitle: "Acceptance by Family" },
  { key: "followUps", label: "Follow-ups", icon: Activity, endpoint: "followUps", statusField: "reintegration_progressing", chartField: "follow_up_period", chartTitle: "Follow-ups by Period" },
  { key: "caseClosures", label: "Case Closures", icon: FileCheck, endpoint: "caseClosures", statusField: "final_outcome", chartField: "overall_reintegration_status", chartTitle: "Closure Status" },
];

// Helper to extract the date
const getRecordDate = (r) => {
  const dateStr = r.created_at || r.date_of_referral || r.date_admitted || r.enrollment_date || r.registration_date || r.date_of_plan || r.follow_up_date || r.date_of_closure;
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const processData = (records, config) => {
  if (!records || !records.length) return { statusData: [], chartData: [], total: 0 };
  const statusCounts = {};
  const chartCounts = {};

  records.forEach((r) => {
    const statusVal = r[config.statusField] || "Unknown";
    statusCounts[statusVal] = (statusCounts[statusVal] || 0) + 1;

    let chartVal = r[config.chartField];
    if (Array.isArray(chartVal)) chartVal = chartVal.join(", ");
    if (!chartVal) chartVal = "Not Specified";
    chartCounts[chartVal] = (chartCounts[chartVal] || 0) + 1;
  });

  const statusData = Object.keys(statusCounts).map((k) => ({ name: k.replace(/_/g, " "), value: statusCounts[k] })).sort((a, b) => b.value - a.value);
  const chartData = Object.keys(chartCounts).map((k) => ({ name: k, count: chartCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
  return { statusData, chartData, total: records.length };
};

export default function MOYSAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allData, setAllData] = useState({});
  const [persons, setPersons] = useState([]);

  // Filter States
  const [filterYear, setFilterYear] = useState("all");
  const [filterCounty, setFilterCounty] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const results = {};
        const promises = [
          moysService.persons({ page_size: 1000 }).catch(() => ({ results: [] })),
          ...MODELS.map(async (m) => {
            const res = await moysService[m.endpoint].list({ page_size: 1000 }).catch(() => []);
            results[m.key] = Array.isArray(res) ? res : (res.results || []);
          })
        ];

        const [personRes] = await Promise.all(promises);
        if (!cancelled) {
          setPersons(Array.isArray(personRes?.results) ? personRes.results : (personRes || []));
          setAllData(results);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load some analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // 1. Extract available years and counties for the dropdowns
  const { availableYears, availableCounties, personCountyMap } = useMemo(() => {
    const years = new Set();
    const counties = new Set();
    const pMap = {};

    persons.forEach(p => {
      pMap[p.id || p.person_id] = p.county_resident || "Unknown";
      if (p.county_resident) counties.add(p.county_resident);
    });

    Object.values(allData).forEach(records => {
      records.forEach(r => {
        const d = getRecordDate(r);
        if (d) years.add(d.getFullYear().toString());
        
        let c = r.beneficiary?.county_resident || r.persons?.[0]?.county_resident;
        if (!c && r.beneficiary_id) c = pMap[r.beneficiary_id];
        if (!c && r.person_id) c = pMap[r.person_id];
        if (c) counties.add(c);
      });
    });

    return {
      availableYears: Array.from(years).sort((a, b) => b - a), // Newest first
      availableCounties: Array.from(counties).sort(),
      personCountyMap: pMap
    };
  }, [allData, persons]);

  // 2. Filter the data based on selection
  const filteredData = useMemo(() => {
    if (filterYear === "all" && filterCounty === "all") return allData;

    const result = {};
    Object.keys(allData).forEach(key => {
      result[key] = allData[key].filter(r => {
        let matchYear = true;
        let matchCounty = true;

        if (filterYear !== "all") {
          const d = getRecordDate(r);
          matchYear = d && d.getFullYear().toString() === filterYear;
        }

        if (filterCounty !== "all") {
          let c = r.beneficiary?.county_resident || r.persons?.[0]?.county_resident;
          if (!c && r.beneficiary_id) c = personCountyMap[r.beneficiary_id];
          if (!c && r.person_id) c = personCountyMap[r.person_id];
          matchCounty = c === filterCounty;
        }

        return matchYear && matchCounty;
      });
    });
    return result;
  }, [allData, filterYear, filterCounty, personCountyMap]);

  const filteredPersons = useMemo(() => {
    if (filterCounty === "all") return persons;
    return persons.filter(p => (p.county_resident || "Unknown") === filterCounty);
  }, [persons, filterCounty]);

  // 3. Process Global Metrics using FILTERED data
  const metrics = useMemo(() => {
    let totalRecords = 0;
    let completed = 0;
    let active = 0;
    const trendData = {};
    const genderCounts = { Male: 0, Female: 0, Other: 0 };
    const countyCounts = {};
    const officerCounts = {};
    const serviceCounts = {};
    const globalStatusCounts = {};
    const recentActivity = [];
    const ageGenderData = { "Under 18": { Male: 0, Female: 0 }, "18-24": { Male: 0, Female: 0 }, "25-30": { Male: 0, Female: 0 }, "31+": { Male: 0, Female: 0 } };
    let withPhone = 0;
    let withEmail = 0;

    // Demographics (Filtered persons)
    filteredPersons.forEach(p => {
      const g = (p.gender || "Other").toLowerCase();
      if (g === "male") genderCounts.Male++;
      else if (g === "female") genderCounts.Female++;
      else genderCounts.Other++;

      const age = parseInt(p.age || 0);
      let ageGroup = "31+";
      if (age < 18) ageGroup = "Under 18";
      else if (age <= 24) ageGroup = "18-24";
      else if (age <= 30) ageGroup = "25-30";
      
      if (g === "male") ageGenderData[ageGroup].Male++;
      else if (g === "female") ageGenderData[ageGroup].Female++;

      const county = p.county_resident || "Unknown";
      countyCounts[county] = (countyCounts[county] || 0) + 1;

      if (p.phone_number && p.phone_number.trim() !== "") withPhone++;
      if (p.email && p.email.trim() !== "") withEmail++;
    });

    // Model Aggregations (Filtered data)
    Object.keys(filteredData).forEach(key => {
      const records = filteredData[key] || [];
      const modelConfig = MODELS.find(m => m.key === key);
      totalRecords += records.length;

      records.forEach(r => {
        const statusStr = JSON.stringify(r).toLowerCase();
        let isCompleted = false;
        if (statusStr.includes("completed") || statusStr.includes("closed") || statusStr.includes("reunited") || statusStr.includes("accepted")) {
          completed++;
          isCompleted = true;
        } else {
          active++;
        }

        const mainStatus = r[modelConfig?.statusField] || (isCompleted ? "Completed" : "Active/Pending");
        const formattedStatus = mainStatus.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        globalStatusCounts[formattedStatus] = (globalStatusCounts[formattedStatus] || 0) + 1;

        const officer = r.mys_officer || r.assigned_mys_officer || r.responsible_mys_officer || r.follow_up_officer || r.mys_officer_case_manager;
        if (officer && officer.trim() !== "") officerCounts[officer] = (officerCounts[officer] || 0) + 1;

        let service = r[modelConfig?.chartField];
        if (service) {
          if (Array.isArray(service)) service = service.join(", ");
          serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        }

        const d = getRecordDate(r);
        if (d) {
          const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          trendData[monthYear] = (trendData[monthYear] || 0) + 1;
          
          recentActivity.push({
            model: modelConfig?.label || key,
            action: formattedStatus,
            date: d,
            dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          });
        }
      });
    });

    const sortedTrend = Object.keys(trendData).map(k => ({ name: k, count: trendData[k], dateObj: new Date(k) })).sort((a, b) => a.dateObj - b.dateObj).slice(-6);
    const topCounties = Object.keys(countyCounts).map(k => ({ name: k, count: countyCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topOfficers = Object.keys(officerCounts).map(k => ({ name: k, count: officerCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topServices = Object.keys(serviceCounts).map(k => ({ name: k, count: serviceCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 6);
    const globalStatusData = Object.keys(globalStatusCounts).map(k => ({ name: k, value: globalStatusCounts[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
    const sortedActivity = recentActivity.sort((a, b) => b.date - a.date).slice(0, 6);

    const ageGenderChart = Object.keys(ageGenderData).map(k => ({
      name: k, Male: ageGenderData[k].Male, Female: ageGenderData[k].Female
    }));

    return { 
      totalRecords, completed, active, 
      completionRate: totalRecords ? Math.round((completed / totalRecords) * 100) : 0,
      topCounty: topCounties[0]?.name || "N/A",
      genderData: Object.keys(genderCounts).map(k => ({ name: k, value: genderCounts[k] })).filter(d => d.value > 0),
      ageGenderChart, trendData: sortedTrend, topCounties, topOfficers, topServices, globalStatusData, recentActivity: sortedActivity,
      totalPersons: filteredPersons.length,
      contactData: { withPhone, withEmail, total: filteredPersons.length }
    };
  }, [filteredData, filteredPersons, personCountyMap]);

  if (loading) return <div className="grid h-[80vh] place-items-center"><Loader2 className="size-10 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-12 bg-slate-50/50 p-6 rounded-2xl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-base-300 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">MOYS Analytics Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise data breakdown across all Ministry of Youth & Sports models.</p>
        </div>
        
        {/* FILTERS */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-base-300">
          <div className="flex items-center gap-2 px-2 text-slate-500">
            <Filter className="size-4" />
            <span className="text-sm font-semibold">Filter:</span>
          </div>
          
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-pointer"
          >
            <option value="all">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select 
            value={filterCounty} 
            onChange={(e) => setFilterCounty(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-pointer"
          >
            <option value="all">All Counties</option>
            {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}

      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-base-300 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users className="size-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Beneficiaries</p>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.totalPersons}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><FileText className="size-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Records</p>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.totalRecords}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-100 text-amber-600"><Activity className="size-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Active / Pending</p>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.active}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><CheckCircle className="size-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Completed / Closed</p>
            <h2 className="text-3xl font-bold text-slate-800">{metrics.completed}</h2>
          </div>
        </div>
      </div>

      {/* Executive Insights Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Award className="size-5 text-amber-400" /> Executive Summary</h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
            {filterYear !== "all" || filterCounty !== "all" ? "Currently filtered view showing " : "The Ministry is currently managing "} 
            <span className="font-bold text-white">{metrics.totalRecords}</span> total records across <span className="font-bold text-white">{metrics.totalPersons}</span> beneficiaries. 
            <span className="font-bold text-white"> {metrics.topCounty}</span> has the highest concentration of cases. 
            Overall completion rate is currently at <span className="font-bold text-emerald-400">{metrics.completionRate}%</span>.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center bg-white/10 px-5 py-3 rounded-lg backdrop-blur-sm border border-white/10">
            <p className="text-3xl font-bold">{metrics.active}</p>
            <p className="text-xs text-slate-300 uppercase tracking-wider mt-1">Active</p>
          </div>
          <div className="text-center bg-white/10 px-5 py-3 rounded-lg backdrop-blur-sm border border-white/10">
            <p className="text-3xl font-bold">{metrics.completed}</p>
            <p className="text-xs text-slate-300 uppercase tracking-wider mt-1">Closed</p>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL STATUS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Status Distribution */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <PieIcon className="size-4 text-indigo-500" /> Overall Ministry Status Breakdown
          </h3>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.globalStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                  {metrics.globalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', textTransform: 'capitalize' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="size-4 text-rose-500" /> Live Recent Activity
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-2">
            {metrics.recentActivity.length > 0 ? metrics.recentActivity.map((act, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{act.model}</span>
                  <span className="text-xs font-medium text-emerald-600 mt-0.5">{act.action}</span>
                </div>
                <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 shadow-sm">
                  {act.dateStr}
                </span>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-8">No recent activity found.</p>}
          </div>
        </div>
      </div>

      {/* Row 3: Core Demographics & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-500" /> System-Wide Creation Trends (Last 6 Months)
          </h3>
          <div className="h-64 w-full">
            {metrics.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-slate-400">No trend data</div>}
          </div>
        </div>

        {/* Data Completeness */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500" /> Data Quality Score
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-600">Phone Numbers</span>
                <span className="font-bold text-slate-800">{metrics.contactData.withPhone} / {metrics.contactData.total}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(metrics.contactData.withPhone / (metrics.contactData.total || 1)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-600">Email Addresses</span>
                <span className="font-bold text-slate-800">{metrics.contactData.withEmail} / {metrics.contactData.total}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(metrics.contactData.withEmail / (metrics.contactData.total || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Demographics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age vs Gender Stacked Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="size-4 text-purple-500" /> Age & Gender Demographics
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.ageGenderChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Counties (Horizontal Bar) */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="size-4 text-rose-500" /> Top 5 Counties
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topCounties} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: System Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Officers */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Award className="size-4 text-amber-500" /> Top MYS Officers (Caseload)
          </h3>
          <div className="space-y-3">
            {metrics.topOfficers.map((officer, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`grid size-7 place-items-center rounded-full text-white text-xs font-bold ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-blue-500'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{officer.name}</span>
                </div>
                <span className="text-xs font-bold bg-white px-3 py-1 border border-slate-200 rounded-full text-slate-600 shadow-sm">{officer.count} cases</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Global Services */}
        <div className="bg-white rounded-xl border border-base-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <HeartHandshake className="size-4 text-emerald-500" /> Top Services Accessed (All Models)
          </h3>
          <div className="space-y-3">
            {metrics.topServices.map((service, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-sm font-semibold text-slate-700 truncate pr-4">{service.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(service.count / (metrics.topServices[0]?.count || 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right">{service.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model-Specific Breakdown */}
      <div className="pt-6 border-t border-base-300 mt-8">
        <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 className="size-6 text-blue-600" /> Model-Specific Breakdown
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {MODELS.map((model) => {
            const Icon = model.icon;
            // Use the FILTERED data for the model breakdowns
            const data = filteredData[model.key] || [];
            const { statusData, chartData, total } = processData(data, model);

            if (total === 0) return null;

            return (
              <div key={model.key} className="bg-white rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                
                <div className="bg-slate-50 px-5 py-4 border-b border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800">{model.label}</h2>
                      <p className="text-xs font-medium text-slate-500">{total} Records</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <BarChart3 className="size-3" /> {model.chartTitle}
                    </h3>
                    <div className="h-48 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <div className="flex h-full items-center justify-center text-xs text-slate-400">No data</div>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <Activity className="size-3" /> Status Breakdown
                    </h3>
                    <div className="h-48 w-full flex items-center justify-center">
                      {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: '11px', borderRadius: '6px', textTransform: 'capitalize' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <div className="flex h-full items-center justify-center text-xs text-slate-400">No data</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



