// components/ldea/detail.MultiPersonPicker.jsx
// Shared building blocks for record detail pages.
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

/* ------------------------------- helpers ------------------------------- */

export function formatDate(v) {
  if (!v) return null;
  const [y, m, d] = String(v).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return v;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatTime(v) {
  if (!v) return null;
  return String(v).slice(0, 5);
}

export function titleCase(v) {
  if (!v) return v;
  const s = String(v).replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === "") return null;
  return `${quantity} ${unit || ""}`.trim();
}

/* ------------------------------ navigation ----------------------------- */

export function Breadcrumb({ to, parent, current, mono }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-base-content/60" aria-label="Breadcrumb">
      <Link to={to} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-base-200 hover:text-base-content">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {parent}
      </Link>
      <ChevronRight className="size-3.5 text-base-content/30" aria-hidden="true" />
      <span className={"truncate font-medium text-base-content " + (mono ? "font-mono text-[13px]" : "")}>
        {current}
      </span>
    </nav>
  );
}

export function HeaderActions({ editTo, onDelete }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-ghost btn-sm rounded-lg text-error hover:bg-error/10"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </button>
      )}
      {editTo && (
        <Link to={editTo} className="btn btn-primary btn-sm rounded-lg shadow-sm">
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Link>
      )}
    </div>
  );
}

/* -------------------------------- header ------------------------------- */

export function DetailHeader({ chips, title, subtitle, actions, children }) {
  return (
    <header className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {chips && <div className="flex flex-wrap items-center gap-2.5">{chips}</div>}
          <h1 className={"text-2xl font-semibold tracking-tight " + (chips ? "mt-3" : "")}>{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-base-content/60">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </header>
  );
}

const COLS = { 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };

export function FactStrip({ cols = 4, children }) {
  return (
    <dl className={"grid grid-cols-2 divide-x divide-y divide-base-300 border-t border-base-300 bg-base-200/40 sm:divide-y-0 " + COLS[cols]}>
      {children}
    </dl>
  );
}

export function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {Icon && <Icon className="size-4 shrink-0 text-base-content/40" aria-hidden="true" />}
      <div className="min-w-0">
        <dt className="text-xs text-base-content/55">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold">{value || "—"}</dd>
      </div>
    </div>
  );
}

/* --------------------------------- cards -------------------------------- */

export function DetailCard({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-base-300 px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="size-4 text-base-content/50" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DetailList({ children }) {
  return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>;
}

export function DetailRow({ icon: Icon, label, value, full, mono }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={"min-w-0 " + (full ? "sm:col-span-2" : "")}>
      <dt className="flex items-center gap-1.5 text-xs text-base-content/55">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className={"mt-1 text-sm " + (mono ? "font-mono " : "") + (empty ? "text-base-content/35" : "font-medium")}>
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}

export function EmptyNote({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/30 px-4 py-8 text-center">
      {Icon && (
        <span className="grid size-10 place-items-center rounded-full bg-base-200 text-base-content/40">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm text-base-content/60">{children}</p>
    </div>
  );
}