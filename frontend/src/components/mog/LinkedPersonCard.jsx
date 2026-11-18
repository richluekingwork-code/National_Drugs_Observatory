// frontend/src/components/mog/LinkedPersonCard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Calendar, MapPin, Phone, Mail, Briefcase,
  GraduationCap, Globe, Pill, Activity, AlertTriangle,
  FileText, HeartPulse, ExternalLink, User,
} from "lucide-react";
import { mogService } from "../../services/mogService";

const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (v === true) return "Yes";
  if (v === false) return "No";
  return String(v);
};

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
};

const initialsOf = (p) =>
  [p.first_name, p.last_name]
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-base-content/55">
        <Icon className="size-3.5 shrink-0" /> {label}
      </p>
      <p className="mt-0.5 truncate text-sm" title={value}>{value}</p>
    </div>
  );
}

function Divider() {
  return <div className="col-span-full h-px bg-base-300/60" aria-hidden />;
}

export default function LinkedPersonCard({ personUuid, compact = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [person, setPerson] = useState(null);

  useEffect(() => {
    if (!personUuid) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    mogService
      .person(personUuid)
      .then((r) => { if (!cancelled) setPerson(r.data); })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.detail || e.message || "Failed to load person.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [personUuid]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60">
        <Loader2 className="size-4 animate-spin" /> Loading LDEA person…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
        {error}
      </div>
    );
  }
  if (!person) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <header className="flex items-start gap-4 border-b border-base-300 bg-base-200/40 p-4">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
          {person.photo ? (
            <img src={person.photo} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-lg font-semibold">{initialsOf(person)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0 text-base-content/45" />
            <h3 className="truncate text-base font-semibold">{person.full_name}</h3>
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-base-content/50">
            {person.person_id}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {person.gender && (
              <span className="rounded-full bg-base-200 px-2 py-0.5 capitalize">
                {person.gender}
              </span>
            )}
            {person.age != null && (
              <span className="rounded-full bg-base-200 px-2 py-0.5">{person.age} yrs</span>
            )}
            {person.nationality && (
              <span className="rounded-full bg-base-200 px-2 py-0.5">{person.nationality}</span>
            )}
            {person.county_resident && (
              <span className="rounded-full bg-base-200 px-2 py-0.5">{person.county_resident}</span>
            )}
          </div>
        </div>
        <Link
          to={`/mog/people/${person.person_id}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Full profile <ExternalLink className="size-3" />
        </Link>
      </header>

      {!compact && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={Calendar}      label="Incident date"     value={fmtDate(person.incident_date)} />
          <Field icon={MapPin}        label="Incident location" value={fmt(person.incident_location)} />
          <Field icon={MapPin}        label="Incident county"   value={fmt(person.incident_county)} />
          <Field icon={Phone}         label="Phone"             value={fmt(person.phone_number)} />
          <Field icon={Mail}          label="Email"             value={fmt(person.email)} />
          <Field icon={MapPin}        label="Address"           value={fmt(person.address)} />
          <Field icon={Briefcase}     label="Profession"        value={fmt(person.professional_status)} />
          <Field icon={GraduationCap} label="Education"         value={fmt(person.educational_level)} />
          <Field icon={Globe}         label="Marital status"    value={fmt(person.marital_status)} />

          <Divider />

          <Field icon={Pill}          label="Primary drug"      value={fmt(person.type_of_drug_used)} />
          <Field icon={Activity}      label="Dependency"        value={fmt(person.dependency_level)} />
          <Field icon={Activity}      label="Frequency"         value={fmt(person.frequency_of_use)} />
          <Field icon={Pill}          label="Method"            value={fmt(person.method_of_use)} />
          <Field icon={Calendar}      label="Last used"         value={fmtDate(person.last_used_date)} />
          <Field icon={Calendar}      label="Age first used"    value={fmt(person.age_first_used)} />

          <Divider />

          <Field icon={AlertTriangle} label="Overdose history"  value={fmt(person.overdose_history)} />
          <Field icon={AlertTriangle} label="Overdose count"    value={fmt(person.overdose_count)} />
          <Field icon={HeartPulse}    label="Mental health"     value={fmt(person.mental_health_issues)} />
          <Field icon={FileText}      label="Rehab history"     value={fmt(person.rehab_history)} />
          <Field icon={FileText}      label="Arrest ref."       value={fmt(person.arrest_reference)} />
        </div>
      )}
    </section>
  );
}