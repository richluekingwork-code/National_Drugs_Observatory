import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function DetailHeader({ back, title, subtitle, badge, actions }) {
  return (
    <>
      <Link to={back} className="btn btn-ghost btn-sm normal-case">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-base-content/60">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">{badge}{actions}</div>
      </header>
    </>
  );
}

export function Section({ title, children }) {
  return (
    <section className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function Row({ label, value, full }) {
  const v = value === null || value === undefined || value === "" ? "—" : value;
  const display = typeof v === "boolean" ? (v ? "Yes" : "No") : v;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-wide text-base-content/50">{label}</dt>
      <dd className="text-sm whitespace-pre-line">{display}</dd>
    </div>
  );
}

export function PanelSpinner() {
  return (
    <div className="grid place-items-center py-20">
      <span className="loading loading-spinner loading-md text-primary" aria-label="Loading" />
    </div>
  );
}

export function PanelError({ message }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-[--radius-box] border border-base-300 bg-base-100 p-6 text-sm text-base-content/70">
      {message ?? "Could not load this record."}
    </div>
  );
}