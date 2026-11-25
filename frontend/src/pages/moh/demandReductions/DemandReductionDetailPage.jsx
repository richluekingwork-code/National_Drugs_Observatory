import { useParams } from "react-router-dom";
import {
  User, Activity, MapPin, FileText,
  AlertTriangle, Brain, HeartPulse, Briefcase, Phone, Pill, CircleUserRound, ChevronDown,
} from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { mohService } from "../../../services/mohService";

/* Balanced rich styling: comfortable reading size, compact layout. */

const LEVELS = ["low", "moderate", "high"];
const LEVEL = {
  low: { fill: "bg-success", chip: "bg-success/10 text-success ring-success/25" },
  moderate: { fill: "bg-warning", chip: "bg-warning/15 text-warning ring-warning/30" },
  high: { fill: "bg-error", chip: "bg-error/10 text-error ring-error/25" },
};

const STATUS_STYLE = {
  accepted: { bar: "bg-success", chip: "bg-success/10 text-success ring-success/25" },
  declined: { bar: "bg-error", chip: "bg-error/10 text-error ring-error/25" },
};
const STATUS_FALLBACK = { 
  bar: "bg-base-content/20", 
  chip: "bg-base-content/5 text-base-content/60 ring-base-content/15" 
};

const TONE = {
  primary: { top: "border-t-primary", chip: "bg-primary/10 text-primary", band: "bg-primary/[0.04]" },
  warning: { top: "border-t-warning", chip: "bg-warning/15 text-warning", band: "bg-warning/[0.06]" },
  info: { top: "border-t-info", chip: "bg-info/10 text-info", band: "bg-info/[0.04]" },
};

const isEmpty = (d) =>
  d === null || d === undefined || d === "" || (typeof d === "string" && d.trim() === "");

/* ---------- primitives ---------- */

function Field({ label, value, span = false, children }) {
  const display = children ?? value;
  return (
    <div className={`${span ? "col-span-full" : "min-w-0"} rounded-lg border border-base-200 bg-base-200/40 px-3 py-2 transition-colors hover:bg-base-200/80`}>
      <dt className="text-xs font-medium text-base-content/55">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line break-words text-sm font-semibold text-base-content">
        {isEmpty(display) ? <span className="font-normal text-base-content/30">—</span> : display}
      </dd>
    </div>
  );
}

function SubSection({ icon: Icon, title, tone = "primary", lgCols = 3, children }) {
  const t = TONE[tone];
  const lgClass = lgCols === 4 ? "lg:grid-cols-4" : lgCols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <div className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-base-content/80">
        <span className={`grid size-5 shrink-0 place-items-center rounded ${t.chip}`}>
          <Icon className="size-3.5" />
        </span>
        {title}
        <span className="h-px flex-1 bg-base-300/60" aria-hidden />
      </h3>
      <dl className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${lgClass}`}>{children}</dl>
    </div>
  );
}

function Panel({ icon: Icon, title, description, tone = "primary", children }) {
  const t = TONE[tone];
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-t-[3px] border-base-300 bg-base-100 shadow-sm ${t.top}`}
    >
      <header className={`flex items-center gap-2.5 border-b border-base-300 px-4 py-3 ${t.band}`}>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg shadow-sm ${t.chip}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-base-content">{title}</h2>
          <p className="text-xs font-medium text-base-content/60">{description}</p>
        </div>
      </header>
      <div className="flex-1 space-y-5 p-4 sm:p-5">{children}</div>
    </article>
  );
}

function Block({ id, icon: Icon, title, tone = "primary", children }) {
  const t = TONE[tone];
  return (
    <section
      id={id}
      className={`flex h-full scroll-mt-24 flex-col overflow-hidden rounded-xl border border-t-[3px] border-base-300 bg-base-100 shadow-sm ${t.top}`}
    >
      <h2 className={`flex items-center gap-2.5 border-b border-base-300 px-4 py-3 text-base font-bold text-base-content ${t.band}`}>
        <span className={`grid size-7 shrink-0 place-items-center rounded-md shadow-sm ${t.chip}`}>
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function HealthFlag({ active, icon: Icon, label, detail }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-warning/15 text-warning ring-1 ring-inset ring-warning/30"
          : "bg-base-100 text-base-content/40 line-through decoration-base-content/30 ring-1 ring-inset ring-base-300"
      }`}
    >
      <Icon className="size-3.5" />
      {label}
      {detail && <span className="opacity-70">{detail}</span>}
    </span>
  );
}

function Dependency({ level }) {
  if (!level) return null;
  const s = LEVEL[level];
  if (!s) return <span className="capitalize">{level}</span>;
  const at = LEVELS.indexOf(level);
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-base-100 px-2.5 py-1 shadow-sm ring-1 ring-inset ring-base-300">
      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${s.chip}`}>
        {level}
      </span>
      <span className="flex gap-1" role="img" aria-label={`Dependency: ${level}`}>
        {LEVELS.map((l, i) => (
          <span key={l} className={`h-1.5 w-5 rounded-full transition-colors ${i <= at ? s.fill : "bg-base-300"}`} />
        ))}
      </span>
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-5 w-1.5 rounded-full bg-primary shadow-sm" aria-hidden />
      <h2 className="text-xl font-bold tracking-tight text-base-content">{children}</h2>
    </div>
  );
}

/* ---------- page ---------- */

export default function DemandReductionDetailPage() {
  const { id } = useParams();
  const { data: record, loading, error } = useResource(mohService.demandReductions, id);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }
  if (error || !record) {
    return <div className="p-6 text-center text-base font-medium text-error">Demand reduction record not found.</div>;
  }

  const status = STATUS_STYLE[record.referral_status] ?? STATUS_FALLBACK;
  const cityDistrict = [record.city, record.district].filter(Boolean).join(", ");
  const hasPersons = record.persons && record.persons.length > 0;
  const showStatusBadge = record.referral_status && record.referral_status !== "pending";

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      
      {/* Main Page Card */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        
        {/* Card Header */}
        <div className="border-b border-base-300 bg-base-50/50 p-5 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Demand Reduction
            </h1>
            <span className="rounded-full bg-base-200 px-2.5 py-0.5 text-sm font-semibold text-base-content/70">
              #{record.id}
            </span>
            {showStatusBadge && (
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset shadow-sm ${status.chip}`}>
                {record.referral_status}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-base-content/60">
            Read-only view of the demand reduction record and beneficiary details.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-6">
          <div className="space-y-8">
            
            {/* Beneficiary profile (collapsed by default) */}
            {hasPersons && (
              <details className="group overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm transition-all">
                <summary className="flex cursor-pointer items-center justify-between gap-3 bg-base-200/50 px-4 py-3.5 transition-colors hover:bg-base-200/80 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="h-4 w-1.5 rounded-full bg-primary shadow-sm" aria-hidden />
                    <h2 className="text-lg font-bold tracking-tight text-base-content">Beneficiary profile</h2>
                    <span className="rounded-full bg-base-100 px-2.5 py-0.5 text-xs font-semibold text-base-content/70 shadow-sm ring-1 ring-inset ring-base-300">
                      {record.persons.length} {record.persons.length === 1 ? "person" : "people"}
                    </span>
                  </span>
                  <ChevronDown className="size-5 text-base-content/50 transition-transform duration-300 group-open:rotate-180" />
                </summary>

                <div className="space-y-8 border-t border-base-300 p-4 sm:p-5">
                  {record.persons.map((person) => {
                    const name = [person.first_name, person.last_name].filter(Boolean).join(" ") || "Unnamed";
                    const initials = `${person.first_name?.[0] ?? ""}${person.last_name?.[0] ?? ""}`.toUpperCase();
                    const chips = [person.gender, person.age != null ? `${person.age} yrs` : null, person.nationality].filter(Boolean);

                    return (
                      <div key={`profile-${person.id}`} className="space-y-5">
                        
                        {/* Person banner */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-gradient-to-r from-primary/[0.08] to-transparent p-3.5 shadow-sm">
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-content shadow-md">
                              {initials || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold leading-tight text-base-content">{name}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {chips.length ? (
                                  chips.map((c) => (
                                    <span
                                      key={c}
                                      className="rounded-full bg-base-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-base-content/70 shadow-sm ring-1 ring-inset ring-base-300"
                                    >
                                      {c}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-base-content/50">No demographic details</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Dependency level={person.dependency_level} />
                        </div>

                        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
                          {/* Person information */}
                          <div className="lg:col-span-5">
                            <Panel icon={User} title="Person information" description="Identity, contact and background" tone="primary">
                              <SubSection icon={CircleUserRound} title="Identity" tone="primary" lgCols={3}>
                                <Field label="First name" value={person.first_name} />
                                <Field label="Last name" value={person.last_name} />
                                <Field label="Gender" value={person.gender} />
                                <Field label="Date of birth" value={person.date_of_birth} />
                                <Field label="Age" value={person.age != null ? `${person.age} yrs` : null} />
                                <Field label="Marital status" value={person.marital_status} />
                              </SubSection>

                              <SubSection icon={Briefcase} title="Background" tone="primary" lgCols={3}>
                                <Field label="Nationality" value={person.nationality} />
                                <Field label="Address" value={person.address} />
                                <Field label="Professional status" value={person.professional_status} />
                              </SubSection>

                              <SubSection icon={Phone} title="Contact and education" tone="primary" lgCols={2}>
                                <Field label="Education" value={person.educational_level} />
                                <Field label="Phone" value={person.phone_number} />
                                <Field label="County" value={person.county_resident} />
                                <Field label="District" value={person.district} />
                              </SubSection>
                            </Panel>
                          </div>

                          {/* Substance use and health */}
                          <div className="lg:col-span-7">
                            <Panel icon={Pill} title="Victim profile" description="Substance use and health" tone="warning">
                              <SubSection icon={Pill} title="Substance use" tone="warning" lgCols={3}>
                                <Field label="Primary substance" value={person.primary_substance_user} />
                                <Field label="Frequency" value={person.frequency_of_use} />
                                <Field label="Method" value={person.method_of_use} />
                                <Field label="Age first used" value={person.age_first_used} />
                                <Field label="Last used" value={person.last_used_date} />
                                <Field label="Years of addiction" value={person.duration_of_addiction_years} />
                                <Field label="Dependency" span>
                                  <div className="mt-1">
                                    <Dependency level={person.dependency_level} />
                                  </div>
                                </Field>
                              </SubSection>

                              <SubSection icon={HeartPulse} title="Health and reference" tone="warning" lgCols={3}>
                                <Field label="Health flags" span>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    <HealthFlag
                                      active={person.overdose_history}
                                      icon={AlertTriangle}
                                      label="Overdose"
                                      detail={person.overdose_count ? `× ${person.overdose_count}` : null}
                                    />
                                    <HealthFlag active={person.mental_health_issues} icon={Brain} label="Mental health" />
                                    <HealthFlag active={person.rehab_history} icon={HeartPulse} label="Rehab" />
                                  </div>
                                </Field>
                                <Field label="Rehab details" value={person.rehab_details} />
                                <Field label="Arrest reference">
                                  {person.arrest_reference ? (
                                    <span className="font-mono">{person.arrest_reference}</span>
                                  ) : null}
                                </Field>
                                <Field label="Created on" value={new Date(person.created_at).toLocaleDateString()} />
                              </SubSection>
                            </Panel>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}

            {/* Demand reduction details */}
            <div className="space-y-4 pt-3">
              <SectionTitle>Demand reduction details</SectionTitle>

              <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Block id="treatment" icon={Activity} title="Treatment details" tone="primary">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Facility" value={record.treatment_facility} />
                    <Field label="Type of treatment" value={record.type_of_treatment} />
                    <Field label="Cases" value={record.cases} />
                    <Field label="Treatment description" value={record.treatment} span />
                  </dl>
                </Block>

                <Block id="clinical" icon={FileText} title="Clinical information" tone="warning">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Injection substance" value={record.injection_substance} />
                    <Field label="Route" value={record.route_of_administration} />
                    <Field label="Psychotherapeutic" value={record.psychotherapeutic_intervention} />
                    <Field label="Psychotropic" value={record.psychotropic_interventions} />
                    <Field label="Comorbid conditions" value={record.comorbid_conditions} span />
                    <Field label="Drug test" value={record.drug_test} span />
                  </dl>
                </Block>

                <Block id="referral" icon={MapPin} title="Referral and location" tone="info">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Receiving facility" value={record.receiving_facility_name} />
                    <Field label="Admission status" value={record.admission_status} />
                    <Field label="Referred from" value={record.refer_from} />
                    <Field label="Referred to" value={record.refer_to} />
                    <Field label="County" value={record.county} />
                    <Field label="City / district" value={cityDistrict} />
                  </dl>
                </Block>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}