import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Copy, Check,
  IdCard, BookOpen, Flag, ShieldAlert, Search as SearchIcon,
  FileText, Gavel, HeartPulse, ChevronRight, History,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useResource } from "../../../hooks/useResource";
import { useRoles } from "../../../hooks/useRoles";
import { useAuth } from "../../../contexts/AuthContext"
import { ldeaService } from "../../../services/ldeaService";
import { mogService } from "../../../services/mogService";
import { mohService } from "../../../services/mohService";
import { PageSpinner, PageError } from "../seizures/SeizureDetailPage";
import { StatusBadge } from "../seizures/SeizuresPage";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ROLE_STYLES = {
  suspect: "bg-error/10 text-error ring-error/25",
  victim: "bg-warning/15 text-warning-content ring-warning/40",
  witness: "bg-info/10 text-info ring-info/25",
};

function titleCase(v) {
  if (!v) return v;
  return String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, " ");
}

function formatDate(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split("-").map(Number);
  if (!y || !m || !d) return v;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function initials(p) {
  return (
    [p.first_name, p.last_name].filter(Boolean).map((s) => s[0]).join("").toUpperCase() || "?"
  );
}

function fullName(p) {
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PersonDetailPage() {
  const { id } = useParams();
  
  // 1. ALL HOOKS MUST BE CALLED HERE, AT THE VERY TOP
  const { canWrite } = useRoles();
  const { memberships = [] } = useAuth(); 
  const { data: person, loading, error } = useResource(ldeaService.persons, id);

  // 2. EARLY RETURNS COME ONLY AFTER ALL HOOKS HAVE BEEN CALLED
  if (loading) return <PageSpinner />;
  if (error || !person) return <PageError message={error} />;

  const address = [person.address, person.district, person.county].filter(Boolean).join(", ");
  const hasFlags = person.is_repeat_offender || person.is_under_investigation;
  
  const belongsToMOH = memberships.some(
    (m) => m.institution?.code === "MOH" || m.institution?.name === "MOH",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb / back */}
      <nav className="flex items-center gap-1.5 text-sm text-base-content/60" aria-label="Breadcrumb">
        <Link to="/persons" className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-base-200 hover:text-base-content">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Persons
        </Link>
        <ChevronRight className="size-3.5 text-base-content/30" aria-hidden="true" />
        <span className="truncate font-medium text-base-content">{fullName(person)}</span>
      </nav>

      {/* Profile header */}
      <header className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {person.photo ? (
            <img
              src={person.photo}
              alt={fullName(person)}
              className="size-24 shrink-0 rounded-2xl border border-base-300 object-cover shadow-sm"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-24 shrink-0 place-items-center rounded-2xl bg-primary text-3xl font-semibold tracking-tight text-primary-content"
            >
              {initials(person)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{fullName(person)}</h1>
              <span
                className={
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset " +
                  (ROLE_STYLES[person.role] ?? "bg-base-200 text-base-content/70 ring-base-300")
                }
              >
                {titleCase(person.role)}
              </span>
            </div>

            {person.other_name && (
              <p className="mt-0.5 text-sm text-base-content/60">Also known as {person.other_name}</p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <CopyId value={person.person_id} />
              {hasFlags && (
                <div className="flex flex-wrap gap-1.5">
                  {person.is_repeat_offender && (
                    <Flag_ icon={ShieldAlert} tone="error">Repeat offender</Flag_>
                  )}
                  {person.is_under_investigation && (
                    <Flag_ icon={SearchIcon} tone="warning">Under investigation</Flag_>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <Link
              to={`/persons/${person.id}/timeline`}
              className="btn btn-outline btn-sm rounded-lg normal-case"
            >
              <History className="size-3.5" aria-hidden="true" />
              Timeline
            </Link>

            {canWrite && (
              <Link
                to={`/persons/${person.id}/edit`}
                className="btn btn-primary btn-sm rounded-lg shadow-sm"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Key facts strip */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-base-300 border-t border-base-300 bg-base-200/40 sm:grid-cols-4 sm:divide-y-0">
          <Fact label="Age" value={person.age != null ? `${person.age} years` : null} />
          <Fact label="Gender" value={titleCase(person.gender)} />
          <Fact label="Nationality" value={person.nationality} />
          <Fact label="County" value={person.county} />
        </dl>
      </header>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Section icon={IdCard} title="Identity & documents">
            <Row label="Date of birth" value={formatDate(person.date_of_birth)} />
            <Row label="Marital status" value={titleCase(person.marital_status)} />
            <Row label="National ID" value={person.national_id} mono />
            <Row label="Passport number" value={person.passport_number} mono />
          </Section>

          <Section icon={BookOpen} title="Background">
            <Row label="Occupation" value={person.occupation} />
            <Row label="Professional status" value={person.professional_status} />
            <Row label="Education" value={person.educational_level} />
          </Section>

          <Section icon={FileText} title="Case context">
            <Row label="Drug use" value={person.drug_user} />
            <Row label="Repeat offender" value={<YesNo value={person.is_repeat_offender} danger />} />
            <Row label="Under investigation" value={<YesNo value={person.is_under_investigation} danger />} />
          </Section>

          {person.remarks && (
            <Section icon={FileText} title="Remarks" single>
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">
                {person.remarks}
              </p>
            </Section>
          )}

          {/* Role-aware related records */}
          {person.role === "suspect" && <PersonArrests personId={person.id} />}
          
          {/* 3. PASS belongsToMOH AS A PROP */}
          {person.role === "victim" && (
            <PersonVictimHistory personId={person.id} belongsToMOH={belongsToMOH} />
          )}

          {/* MOG records (renders only for MOG members) */}
          <PersonMOGSummary personId={person.id} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card title="Contact" icon={Phone}>
            <ul className="space-y-4">
              <ContactItem icon={Phone} label="Phone" value={person.phone_number} href={person.phone_number && `tel:${person.phone_number}`} />
              <ContactItem icon={Mail} label="Email" value={person.email} href={person.email && `mailto:${person.email}`} />
              <ContactItem icon={MapPin} label="Address" value={address} />
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function CopyId({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy full ID"
      className="group inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-200/50 px-2 py-1 text-xs text-base-content/70 transition-colors hover:border-base-content/30 hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="text-base-content/50">ID</span>
      <span className="font-mono">{value.slice(0, 8)}</span>
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5 opacity-50 group-hover:opacity-100" aria-hidden="true" />
      )}
      <span className="sr-only">{copied ? "Copied" : "Copy ID"}</span>
    </button>
  );
}

function Flag_({ icon: Icon, tone, children }) {
  const tones = {
    error: "bg-error/10 text-error ring-error/25",
    warning: "bg-warning/15 text-warning-content ring-warning/40",
  };
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset " + tones[tone]}>
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function Fact({ label, value }) {
  return (
    <div className="px-5 py-3.5">
      <dt className="text-xs text-base-content/55">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold">{value || "—"}</dd>
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

function Section({ title, icon, single, children }) {
  return (
    <Card title={title} icon={icon}>
      {single ? children : <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>}
    </Card>
  );
}

function Row({ label, value, mono }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-xs text-base-content/55">{label}</dt>
      <dd className={"mt-1 text-sm " + (mono ? "font-mono " : "") + (empty ? "text-base-content/35" : "font-medium")}>
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}

function YesNo({ value, danger }) {
  if (!value) return <span className="font-medium text-base-content/60">No</span>;
  return (
    <span className={"font-semibold " + (danger ? "text-error" : "text-success")}>Yes</span>
  );
}

function ContactItem({ icon: Icon, label, value, href }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-base-200 text-base-content/60">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-base-content/55">{label}</p>
        {value ? (
          href ? (
            <a href={href} className="mt-0.5 block break-words text-sm font-medium hover:text-primary">{value}</a>
          ) : (
            <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
          )
        ) : (
          <p className="mt-0.5 text-sm text-base-content/35">Not provided</p>
        )}
      </div>
    </li>
  );
}

function EmptyState({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/30 px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-base-200 text-base-content/40">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm text-base-content/60">{children}</p>
    </div>
  );
}

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Related-record panels (fetched on demand)                           */
/* ------------------------------------------------------------------ */

function PersonArrests({ personId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ldeaService.arrests
      .list({ page: 1, search: "", person: personId })
      .then((d) => !cancelled && setRows(d.results ?? []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [personId]);

  return (
    <Card
      title="Arrests"
      icon={Gavel}
      action={
        !loading && rows.length > 0 && (
          <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium text-base-content/70">
            {rows.length}
          </span>
        )
      }
    >
      {loading && <ListSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyState icon={Gavel}>No arrests recorded for this person.</EmptyState>
      )}
      {!loading && rows.length > 0 && (
        <ul className="-my-1 divide-y divide-base-300">
          {rows.map((a) => (
            <li key={a.id}>
              <Link
                to={`/arrests/${a.id}`}
                className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-base-200/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-primary">
                    {formatDate(a.arrest_date) ?? a.arrest_date}
                  </p>
                  <p className="truncate text-xs text-base-content/55">{a.county || "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={a.status} />
                  <ChevronRight className="size-4 text-base-content/30 group-hover:text-primary" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PersonVictimHistory({ personId, belongsToMOH }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { canWrite } = useRoles();

  useEffect(() => {
    let cancelled = false;
    ldeaService.victimHistories
      .list({ page: 1, person: personId })
      .then((d) => !cancelled && setHistory((d.results ?? [])[0] ?? null))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [personId]);

  return (
    <Card
      title="Victim history"
      icon={HeartPulse}
      action={
        canWrite && !loading && (
          <Link
            to={history ? `/victim-histories/${history.id}/edit` : `/victim-histories/new?person_id=${personId}`}
            className="btn btn-outline btn-xs rounded-md"
          >
            {history ? "Edit" : "Add history"}
          </Link>
        )
      }
    >
      {loading && <ListSkeleton rows={2} />}

      {!loading && !history && (
        <EmptyState icon={HeartPulse}>No substance-use history on record.</EmptyState>
      )}

      {!loading && history && (
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <Row label="Primary substance" value={history.primary_substance} />
          <Row label="Frequency of use" value={history.frequency_of_use} />
          <Row label="Method of use" value={history.method_of_use} />
          <Row label="Dependency level" value={history.dependency_level} />
          <Row label="Age first used" value={history.age_first_used} />
          <Row label="Years of addiction" value={history.duration_of_addiction_years} />
          <Row label="Overdose" value={<YesNo value={history.overdose_history} danger />} />
          <Row label="Mental health issues" value={<YesNo value={history.mental_health_issues} danger />} />
          <Row label="Rehab" value={<YesNo value={history.rehab_history} />} />
        </dl>
      )}
      
      {belongsToMOH && <PersonMOHRecords personId={personId} />}
    </Card>
  );
}

function PersonMOGSummary({ personId }) {
  const { memberships = [] } = useAuth();
  const isMOG = memberships.some(
    (m) => m.institution?.code === "MOG" || m.institution?.name === "MOG",
  );
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!isMOG) return;
    let cancelled = false;
    Promise.all([
      mogService.assessments.list({ person: personId }),
      mogService.followups.list({ person: personId }),
      mogService.tracings.list({ person: personId }),
      mogService.handovers.list({ person: personId }),
      mogService.caseClosures.list({ person: personId }),
    ])
      .then(([a, f, t, h, c]) => {
        if (cancelled) return;
        setCounts({
          assessments: a.count,
          followups: f.count,
          tracings: t.count,
          handovers: h.count,
          closures: c.count,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isMOG, personId]);

  if (!isMOG || !counts) return null;

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">MOG records</h2>
        <Link
          to={`/persons/${personId}/timeline`}
          className="text-xs text-primary hover:underline"
        >
          View full timeline →
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-wide text-base-content/50">{k}</dt>
            <dd className="text-lg font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PersonMOHRecords({ personId }) {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    let cancelled = false;
    mohService.demandReductions
      .list({ person: personId })
      .then((d) => !cancelled && setRecords(d.results ?? []))
      .catch(() => !cancelled && setRecords([]));
    return () => { cancelled = true; };
  }, [personId]);

  if (records === null) {
    return (
      <section className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5 mt-6">
        <h2 className="mb-3 text-base font-semibold">MOH records</h2>
        <p className="text-xs text-base-content/50">Loading…</p>
      </section>
    );
  }

  return (
    <section className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5 mt-6">
      <h2 className="mb-3 text-base font-semibold">MOH records</h2>
      {records.length === 0 ? (
        <p className="text-sm text-base-content/60">
          No demand-reduction records in your institution.
        </p>
      ) : (
        <ul className="divide-y divide-base-300">
          {records.map((r) => (
            <li key={r.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link
                to={`/moh/demand-reductions/${r.id}`}
                className="flex items-center justify-between gap-3 hover:text-primary"
              >
                <span className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {r.type_of_treatment || "Demand reduction"}
                  </p>
                  <p className="truncate text-xs text-base-content/60">
                    {r.county || "—"} · {r.admission_status || "—"}
                  </p>
                </span>
                <span className="text-xs text-base-content/50">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}