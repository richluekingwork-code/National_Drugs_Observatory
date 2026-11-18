import { useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, Users, Pill, ShieldAlert, FolderOpen,
  Activity, FlaskConical, BarChart3, HeartHandshake, Hospital, Building2,
  History, HeartPulse, Scale, Calendar, UserCheck, Banknote, X, ClipboardCheck,
} from "lucide-react";

import { useRoles } from "../../hooks/useRoles";
import { useAuth } from "../../contexts/AuthContext";

const SUPERUSER_NAV = [
  { to: "/admin/institutions", label: "Institutions", icon: Building2 },
];

const ADMIN_NAV = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/memberships", label: "Memberships", icon: ShieldCheck },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: History },
];

const NAV_SECTIONS = [
  {
    title: "Workspace",
    institution: null,
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "LDEA",
    institution: "LDEA",
    items: [
      { to: "/victim-histories", label: "Victims", icon: HeartPulse },
      { to: "/arrests", label: "Arrests", icon: ShieldAlert },
      { to: "/cases", label: "Cases", icon: FolderOpen },
      { to: "/seizures", label: "Seizures", icon: Pill },
      { to: "/raids", label: "Drug raids", icon: Activity },
      { to: "/drug-types", label: "Drug types", icon: FlaskConical },
    ],
  },
  {
    title: "MOG",
    institution: "MOG",
    items: [
      { to: "/mog/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/mog/child-tracking", label: "Child Tracking Tool", icon: ClipboardCheck },
      { to: "/mog/people", label: "Beneficiaries Management", icon: Users },
    ],
  },
  {
    title: "MOH",
    institution: "MOH",
    items: [
      { to: "/moh/victims", label: "Beneficiaries", icon: Users },
      { to: "/moh/prevention", label: "Prevention", icon: HeartHandshake },
      { to: "/moh/facilities", label: "Treatment facilities", icon: Hospital },
    ],
  },
  {
    title: "MOJ",
    institution: "MOJ",
    items: [
      { to: "/moj", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/moj/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/moj/cases", label: "Cases Management", icon: Scale },
      { to: "/moj/hearings", label: "Court Calendar", icon: Calendar },
      { to: "/moj/workloads", label: "Prosecutor Workloads", icon: UserCheck },
      { to: "/moj/fines", label: "Fines & Payments", icon: Banknote },
    ],
  },
  {
    title: "MOYS",
    institution: "MOYS",
    items: [
      { to: "/moys/people", label: "Beneficiaries", icon: Users },
      { to: "/moys/analytics", label: "Analytics Hub", icon: BarChart3 },
    ],
  },
];

const getNavLinkClass = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2.5",
    "text-sm transition-colors duration-150",
    isActive
      ? "bg-primary/10 font-semibold text-primary"
      : "text-base-content/70 hover:bg-base-200 hover:text-base-content",
  ].join(" ");

const sectionTitleClass =
  "px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-base-content/50";

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink to={to} end={end} className={getNavLinkClass} onClick={onNavigate}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarNav({ onNavigate, className = "" }) {
  const { canManageUsers, isSuperuser } = useRoles();
  const { memberships } = useAuth();

  const adminOnly = canManageUsers || isSuperuser;

  const institutionCodes = useMemo(
    () =>
      new Set(
        (memberships ?? []).map((m) => m.institution?.code).filter(Boolean)
      ),
    [memberships]
  );

  const visibleSections = NAV_SECTIONS.filter((s) => {
    if (s.institution === null) return true;
    if (adminOnly) return false;
    return institutionCodes.has(s.institution);
  });

  const showAdmin = isSuperuser || canManageUsers;

  return (
    <nav aria-label="Primary navigation" className={`space-y-1 ${className}`}>
      {visibleSections.map((section, i) => (
        <div key={section.title} className={i > 0 ? "pt-4" : ""}>
          <p className={sectionTitleClass}>{section.title}</p>
          {section.items.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      {showAdmin && (
        <>
          {visibleSections.length > 0 && (
            <div className="my-4 border-t border-base-300" role="separator" />
          )}
          <p className={sectionTitleClass}>Administration</p>

          {isSuperuser &&
            SUPERUSER_NAV.map((item) => (
              <NavItem key={item.to} {...item} onNavigate={onNavigate} />
            ))}

          {canManageUsers &&
            ADMIN_NAV.map((item) => (
              <NavItem key={item.to} {...item} onNavigate={onNavigate} />
            ))}
        </>
      )}
    </nav>
  );
}

/* Desktop sidebar */
export default function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <SidebarNav className="sticky top-20" />
    </aside>
  );
}

/* Mobile drawer */
export function MobileSidebar({ open, onClose }) {
  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-base-100 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-base-300 px-4">
          <span className="text-sm font-bold tracking-tight">Observatory</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="btn btn-ghost btn-square btn-sm"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}