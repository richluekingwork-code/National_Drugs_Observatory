import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, ChevronRight, Scale, FlaskConical, FileText,
  Users, Star, Building2, MapPin, CalendarDays,
} from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { useRoles } from "../../../hooks/useRoles";
import { ldeaService } from "../../../services/ldeaService";
import { PageSpinner, PageError } from "../seizures/SeizureDetailPage";
import { StatusBadge } from "../seizures/SeizuresPage";

const ROLE_ORDER = ["suspect", "victim", "witness"];
const ROLE_LABEL = { suspect: "Suspects", victim: "Victims", witness: "Witnesses" };
const ROLE_DOT = { suspect: "bg-error", victim: "bg-warning", witness: "bg-info" };
const ROLE_AVATAR = {
  suspect: "bg-error/10 text-error",
  victim: "bg-warning/15 text-warning-content",
  witness: "bg-info/10 text-info",
};

function formatDate(v) {
  if (!v) return null;
  const [y, m, d] = String(v).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return v;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

// FIXED: Added safe fallback if data is missing
function initials(p) {
  if (!p) return "?";
  return [p.first_name, p.last_name].filter(Boolean).map((s) => s[0]).join("").toUpperCase() || "?";
}

export default function CaseDetailPage() {
  const { id } = useParams();
  const { canWrite } = useRoles();
  const { data: c, loading, error } = useResource(ldeaService.cases, id);

  if (loading) return <PageSpinner />;
  if (error || !c) return <PageError message={error} />;

  const participants = c.participants ?? [];
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    members: participants.filter((p) => p.role === role),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-base-content/60" aria-label="Breadcrumb">
        <Link to="/cases" className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-base-200 hover:text-base-content">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Cases
        </Link>
        <ChevronRight className="size-3.5 text-base-content/30" aria-hidden="true" />
        <span className="truncate font-mono text-[13px] font-medium text-base-content">{c.case_number}</span>
      </nav>

      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-base-300 bg-base-200/60 px-2 py-0.5 font-mono text-xs font-semibold">
                {c.case_number}
              </span>
              <StatusBadge status={c.status} />
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{c.title}</h1>
          </div>

          {canWrite && (
            <Link to={`/cases/${c.id}/edit`} className="btn btn-primary btn-sm shrink-0 rounded-lg shadow-sm">
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit case
            </Link>
          )}
        </div>

        <dl className="grid grid-cols-2 divide-x divide-y divide-base-300 border-t border-base-300 bg-base-200/40 sm:grid-cols-4 sm:divide-y-0">
          <Fact icon={Building2} label="Court" value={c.court_name} />
          <Fact icon={MapPin} label="County" value={c.county} />
          <Fact icon={CalendarDays} label="Filed" value={formatDate(c.filing_date)} />
          <Fact icon={Users} label="Participants" value={participants.length ? String(participants.length) : null} />
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Charge & substance" icon={Scale}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Row icon={Scale} label="Charge" value={c.charge} />
              <Row icon={FlaskConical} label="Substance" value={c.substance} />
              <Row label="Action taken" value={c.action_taken} full />
            </dl>
          </Card>

          <Card title="Description" icon={FileText}>
            {c.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">
                {c.description}
              </p>
            ) : (
              <p className="text-sm text-base-content/40">No description has been added.</p>
            )}
          </Card>
        </div>

        {/* Participants */}
        <aside>
          <Card
            title="Participants"
            icon={Users}
            action={
              participants.length > 0 && (
                <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium text-base-content/70">
                  {participants.length}
                </span>
              )
            }
          >
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/30 px-4 py-8 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-base-200 text-base-content/40">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm text-base-content/60">No participants linked to this case.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((g) => (
                  <div key={g.role}>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-base-content/60">
                      <span className={"size-2 rounded-full " + ROLE_DOT[g.role]} aria-hidden="true" />
                      {ROLE_LABEL[g.role]}
                      <span className="font-normal text-base-content/40">{g.members.length}</span>
                    </h3>
                    <ul className="-mx-2 space-y-0.5">
                      {g.members.map((p) => {
                        // FIXED: Read from person_arrested instead of person
                        const person = p.person_arrested || {};
                        
                        return (
                          <li key={p.id}>
                            {/* FIXED: Link to arrests instead of persons */}
                            <Link
                              to={`/arrests/${person.id}`}
                              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-base-200/70"
                            >
                              <span
                                aria-hidden="true"
                                className={"grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold " + ROLE_AVATAR[g.role]}
                              >
                                {initials(person)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-medium group-hover:text-primary">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {p.is_primary && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                      <Star className="size-2.5 fill-current" aria-hidden="true" />
                                      Primary
                                    </span>
                                  )}
                                </span>
                                <span className="block truncate text-xs text-base-content/55">
                                  {person.county || "County not recorded"}
                                </span>
                              </span>
                              <ChevronRight className="size-4 shrink-0 text-base-content/25 group-hover:text-primary" aria-hidden="true" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ----------------------------- Building blocks ---------------------------- */

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className="size-4 shrink-0 text-base-content/40" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-base-content/55">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold">{value || "—"}</dd>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, action, children }) {
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

function Row({ icon: Icon, label, value, full }) {
  return (
    <div className={"min-w-0 " + (full ? "sm:col-span-2" : "")}>
      <dt className="flex items-center gap-1.5 text-xs text-base-content/55">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className={"mt-1 text-sm " + (value ? "font-medium" : "text-base-content/35")}>
        {value || "Not provided"}
      </dd>
    </div>
  );
}