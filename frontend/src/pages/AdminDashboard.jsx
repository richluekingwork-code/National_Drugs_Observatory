// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, ShieldCheck, LogIn, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminService } from "../services/adminService";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"];

const prettify = (s = "") =>
  s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function StatCard({ label, value, icon: Icon, tone = "text-primary", hint }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/60">{label}</p>
        <Icon className={`size-5 ${tone}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value ?? "—"}</p>
      {hint && <p className="mt-0.5 text-xs text-base-content/50">{hint}</p>}
    </div>
  );
}

function PieCard({ title, subtitle, data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <section className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-base-content/50">
          No data yet.
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={d.color ?? COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminService.getInstitutionDashboard();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail ?? "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <span className="loading loading-spinner" />;
  if (error) return <div className="alert alert-error"><span>{error}</span></div>;

  const { institution, totals, roles, actions_30d, recent } = data;

  const roleData = roles.map((r) => ({ name: prettify(r.role), value: r.count }));
  const statusData = [
    { name: "Active", value: totals.active_users, color: "#10b981" },
    { name: "Inactive", value: totals.inactive_users, color: "#9ca3af" },
  ];
  const ACTION_COLORS = { login: "#10b981", logout: "#6366f1", login_failed: "#ef4444" };
  const actionData = actions_30d.map((a) => ({
    name: prettify(a.action),
    value: a.count,
    color: ACTION_COLORS[a.action],
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{institution.name} Overview</h1>
        <p className="mt-0.5 text-sm text-base-content/60">
          Users, access, and security activity for this institution only.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={totals.users} icon={Users} />
        <StatCard label="Active users" value={totals.active_users} icon={UserCheck} tone="text-success" />
        <StatCard label="Inactive users" value={totals.inactive_users} icon={UserX} tone="text-base-content/50" />
        <StatCard label="Administrators" value={totals.admins} icon={ShieldCheck} />
        <StatCard
          label="Logins (7 days)"
          value={totals.logins_7d}
          icon={LogIn}
          hint={`${totals.active_logins_7d} unique users`}
        />
        <StatCard label="Failed logins (7 days)" value={totals.failed_7d} icon={AlertTriangle} tone="text-error" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PieCard title="Users by role" subtitle="Active memberships" data={roleData} />
        <PieCard title="Account status" subtitle="Active vs inactive users" data={statusData} />
        <PieCard title="Login activity" subtitle="Last 30 days" data={actionData} />
      </div>

      <section className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-3">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link to="/admin/audit-logs" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-base-300/70">
          {recent.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-base-content/50">
              No recent activity.
            </li>
          )}
          {recent.map((log) => (
            <li key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium">{log.full_name || log.username}</p>
                <p className="text-xs text-base-content/60">
                  {prettify(log.action)} · {log.location || log.ip_address || "Unknown"}
                </p>
              </div>
              <span className="text-xs text-base-content/60">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}