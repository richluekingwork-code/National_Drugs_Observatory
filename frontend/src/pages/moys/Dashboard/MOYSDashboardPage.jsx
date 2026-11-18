// frontend/src/pages/moys/Dashboard/MOYSDashboardPage.jsx
import { useEffect, useState } from "react";
import {
  Users, FileText, Activity, CheckCircle, Loader2, MapPin
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { moysService } from "../../../services/moysService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function MOYSDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, referrals: 0 });
  const [countyData, setCountyData] = useState([]);
  const [genderData, setGenderData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    Promise.all([
      moysService.persons({ page_size: 1000 }),
      moysService.referrals.list({ page_size: 1000 }).catch(() => [])
    ])
      .then(([personRes, referralRes]) => {
        if (cancelled) return;
        
        const persons = Array.isArray(personRes?.results) ? personRes.results : (personRes || []);
        const referrals = Array.isArray(referralRes?.results) ? referralRes.results : (referralRes || []);

        const total = personRes?.count || persons.length;
        const active = persons.filter(p => (p.status || p.case_status || "active").toLowerCase() === "active").length;
        const completed = persons.filter(p => (p.status || p.case_status || "").toLowerCase() === "completed" || (p.status || p.case_status || "").toLowerCase() === "closed").length;
        
        setStats({ total, active, completed, referrals: referralRes?.count || referrals.length });

        const countyCounts = {};
        persons.forEach(p => {
          const c = p.county_resident || "Unknown";
          countyCounts[c] = (countyCounts[c] || 0) + 1;
        });
        const cData = Object.keys(countyCounts)
          .map(key => ({ name: key, count: countyCounts[key] }))
          .sort((a, b) => b.count - a.count); 
        setCountyData(cData);

        const genderCounts = { Male: 0, Female: 0, Other: 0 };
        persons.forEach(p => {
          const g = (p.gender || "Other").toLowerCase();
          if (g === "male") genderCounts.Male++;
          else if (g === "female") genderCounts.Female++;
          else genderCounts.Other++;
        });
        const gData = Object.keys(genderCounts)
          .map(key => ({ name: key, value: genderCounts[key] }))
          .filter(d => d.value > 0);
        setGenderData(gData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="grid h-[80vh] place-items-center"><Loader2 className="size-10 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-base-content">MOYS Dashboard</h1>
        <p className="text-sm text-base-content/60 mt-1">Overview of Ministry of Youth & Sports beneficiaries and cases.</p>
      </div>

      {error && <div className="p-4 rounded-lg bg-error/10 text-error border border-error/20">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary"><Users className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-base-content/60">Total Beneficiaries</p>
            <h2 className="text-3xl font-bold">{stats.total}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-info/10 text-info"><Activity className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-base-content/60">Active Cases</p>
            <h2 className="text-3xl font-bold">{stats.active}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-success/10 text-success"><CheckCircle className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-base-content/60">Completed / Closed</p>
            <h2 className="text-3xl font-bold">{stats.completed}</h2>
          </div>
        </div>
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-warning/10 text-warning"><FileText className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-base-content/60">Total Referrals</p>
            <h2 className="text-3xl font-bold">{stats.referrals}</h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart: Top Counties */}
        <div className="lg:col-span-2 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-base-content/80 mb-4 flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> Top Counties by Beneficiary Count
          </h3>
          <div className="h-72 w-full">
            {countyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countyData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-base-content/50">No data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart: Gender */}
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-base-content/80 mb-4 flex items-center gap-2">
            <Users className="size-4 text-primary" /> Gender Distribution
          </h3>
          <div className="h-72 w-full">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-base-content/50">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}