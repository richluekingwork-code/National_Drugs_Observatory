import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Clock,
  FileText,
  HeartPulse,
  MapPin,
  Pencil,
  Phone,
  Pill,
  User,
} from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { ldeaService } from "../../../services/ldeaService";
import { mohService } from "../../../services/mohService";

const LEVELS = ["low", "moderate", "high"];
const LEVEL = {
  low: { bar: "bg-success", fill: "bg-success", chip: "bg-success/10 text-success ring-success/25" },
  moderate: { bar: "bg-warning", fill: "bg-warning", chip: "bg-warning/15 text-warning ring-warning/30" },
  high: { bar: "bg-error", fill: "bg-error", chip: "bg-error/10 text-error ring-error/25" },
};

const TONE = {
  primary: { top: "border-t-primary", chip: "bg-primary/10 text-primary", band: "bg-primary/[0.06]" },
  info: { top: "border-t-info", chip: "bg-info/10 text-info", band: "bg-info/[0.06]" },
  warning: { top: "border-t-warning", chip: "bg-warning/15 text-warning", band: "bg-warning/[0.07]" },
  success: { top: "border-t-success", chip: "bg-success/10 text-success", band: "bg-success/[0.06]" },
};

const isEmpty = (d) =>
  d === null || d === undefined || d === "" || (typeof d === "string" && d.trim() === "");

const fmtDate = (d) => {
  if (isEmpty(d)) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
};

function Card({ icon: Icon, title, tone = "primary", children }) {
  const t = TONE[tone];
  return (
    <section className={`overflow-hidden rounded-xl border border-t-2 border-base-300 bg-base-100 shadow-sm ${t.top}`}>
      <h2 className={`flex items-center gap-2.5 border-b border-base-300 px-4 py-3 text-sm font-semibold ${t.band}`}>
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${t.chip}`}>
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <div className="px-2 py-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value, children }) {
  const display = children ?? value;
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-md px-2 py-2 text-sm transition-colors hover:bg-base-200/60">
      <dt className="shrink-0 text-base-content/55">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">
        {isEmpty(display) ? <span className="font-normal text-base-content/30">—</span> : display}
      </dd>
    </div>
  );
}

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-base-200/50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-base-content/55">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">
        {isEmpty(value) ? <span className="font-normal text-base-content/30">—</span> : value}
      </p>
    </div>
  );
}

function Flag({ on, label, detail }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset ${on ? "bg-warning/10 ring-warning/30" : "bg-base-100 ring-base-300"}`}>
      <span className={`size-2 shrink-0 rounded-full ${on ? "bg-warning" : "border border-base-content/30"}`} aria-hidden />
      <span className={on ? "font-medium" : "text-base-content/50"}>{label}</span>
      <span className={`ml-auto text-xs ${on ? "font-medium text-warning" : "text-base-content/40"}`}>
        {on ? detail ?? "Yes" : "No"}
      </span>
    </div>
  );
}

function Meter({ level }) {
  const at = LEVELS.indexOf(level);
  return (
    <div className="flex gap-1" role="img" aria-label={`Dependency: ${level ?? "not recorded"}`}>
      {LEVELS.map((l, i) => (
        <span key={l} className={`h-1.5 w-8 rounded-full ${i <= at ? LEVEL[level].fill : "bg-base-300"}`} />
      ))}
    </div>
  );
}

export default function VictimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isMOH = location.pathname.startsWith("/moh");
  const backLabel = isMOH ? "Back to beneficiaries" : "Back to victims";
  const service = isMOH ? mohService.victims : ldeaService.victimHistories;

  const { data: v, loading } = useResource(service, id);

  if (loading) {
    return <div className="grid place-items-center py-20"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  }

  if (!v) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="card border border-warning/40 bg-warning/5">
          <div className="card-body items-start">
            <h2 className="card-title text-warning">Victim not found</h2>
            <p className="text-sm text-base-content/70">
              Record <span className="font-mono">#{id}</span> doesn&apos;t exist.
            </p>
            <button onClick={() => navigate(-1)} className="btn btn-sm mt-2 gap-1.5">
              <ArrowLeft className="size-4" /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const level = LEVEL[v.dependency_level];
  const fullName = [v.first_name, v.middle_name, v.last_name, v.other_name].filter(Boolean).join(" ") || "Unnamed victim";
  const initials = `${(v.first_name?.[0] ?? "").toUpperCase()}${(v.last_name?.[0] ?? "").toUpperCase()}`;
  const ageText = v.age != null ? `${v.age} ${v.age === 1 ? "yr" : "yrs"}` : null;
  const chips = [v.gender, ageText, v.nationality].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-base-content/60 transition-colors hover:text-base-content"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </button>

      <header className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className={`h-1.5 ${level ? level.bar : "bg-base-content/20"}`} />
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.06] to-transparent p-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-4">
            {v.photo ? (
              <img src={v.photo} alt="" className="size-16 shrink-0 rounded-full object-cover ring-2 ring-base-100 shadow-sm" />
            ) : (
              <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-content shadow-sm ring-2 ring-base-100">
                {initials || "?"}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold leading-tight">{fullName}</h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {chips.length ? (
                  chips.map((c) => (
                    <span key={c} className="rounded-full bg-base-100 px-2.5 py-0.5 text-xs capitalize text-base-content/70 ring-1 ring-inset ring-base-300">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-base-content/50">No demographic details</span>
                )}
              </div>
              <p className="mt-1.5 font-mono text-xs text-base-content/45">{v.person_id ?? "no id"}</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {level && (
              <div className="space-y-1.5">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${level.chip}`}>
                  {v.dependency_level} dependency
                </span>
                <Meter level={v.dependency_level} />
              </div>
            )}

            {!isMOH && (
              <button
                className="btn btn-primary btn-sm gap-1.5"
                onClick={() => navigate(`/victim-histories/${id}/edit`)}
              >
                <Pencil className="size-4" /> Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card icon={User} title="Identity" tone="primary">
            <Row label="First name" value={v.first_name} />
            <Row label="Middle name" value={v.middle_name} />
            <Row label="Last name" value={v.last_name} />
            <Row label="Other name" value={v.other_name} />
            <Row label="Gender" value={v.gender} />
            <Row label="Date of birth" value={v.date_of_birth} />
            <Row label="Age" value={ageText} />
            <Row label="Marital status" value={v.marital_status} />
            <Row label="Nationality" value={v.nationality} />
          </Card>

          <Card icon={Phone} title="Contact" tone="info">
            <Row label="Phone" value={v.phone_number} />
            <Row label="Email" value={v.email} />
            <Row label="County" value={v.county_resident} />
            <Row label="District" value={v.district} />
            <Row label="Address" value={v.address} />
          </Card>

          <Card icon={Briefcase} title="Professional" tone="success">
            <Row label="Status" value={v.professional_status} />
            <Row label="Education" value={v.educational_level} />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card icon={MapPin} title="Incident" tone="warning">
            <div className="grid grid-cols-2 gap-2 p-2 lg:grid-cols-4">
              <Tile icon={CalendarClock} label="Date" value={v.incident_date} />
              <Tile icon={Clock} label="Time" value={v.incident_time?.slice(0, 5)} />
              <Tile icon={MapPin} label="County" value={v.incident_county} />
              <Tile icon={MapPin} label="Location" value={v.incident_location} />
            </div>
          </Card>

          <Card icon={Pill} title="Substance use" tone="warning">
            <div className="grid sm:grid-cols-2 sm:gap-x-6">
              <Row label="Primary substance" value={v.primary_substance_user} />
              <Row label="Frequency" value={v.frequency_of_use} />
              <Row label="Method" value={v.method_of_use} />
              <Row label="Age first used" value={v.age_first_used} />
              <Row label="Last used" value={v.last_used_date} />
              <Row label="Years of addiction" value={v.duration_of_addiction_years} />
              <Row label="Dependency level">
                {v.dependency_level ? <span className="capitalize">{v.dependency_level}</span> : null}
              </Row>
              <Row label="Type of drug used" value={v.type_of_drug_used} />
            </div>
          </Card>

          <Card icon={HeartPulse} title="Health" tone="success">
            <div className="grid gap-2 p-2 sm:grid-cols-3">
              <Flag on={v.overdose_history} label="Overdose" detail={v.overdose_count ? `× ${v.overdose_count}` : null} />
              <Flag on={v.mental_health_issues} label="Mental health" />
              <Flag on={v.rehab_history} label="Rehab" />
            </div>
            {v.rehab_details && (
              <p className="mx-2 mb-2 rounded-lg bg-base-200/50 px-3 py-2.5 text-sm text-base-content/80">
                {v.rehab_details}
              </p>
            )}
          </Card>

          <Card icon={FileText} title="Record" tone="info">
            <div className="grid sm:grid-cols-2 sm:gap-x-6">
              <Row label="Arrest reference">{v.arrest_reference ? <span className="font-mono">{v.arrest_reference}</span> : null}</Row>
              <Row label="Created" value={fmtDate(v.created_at)} />
            </div>
            <div className="m-2 rounded-lg border-l-4 border-warning/50 bg-warning/[0.07] px-3 py-2.5">
              <p className="mb-1 text-xs text-base-content/55">Remarks</p>
              {isEmpty(v.remarks) ? (
                <p className="text-sm text-base-content/30">—</p>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed">{v.remarks}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}