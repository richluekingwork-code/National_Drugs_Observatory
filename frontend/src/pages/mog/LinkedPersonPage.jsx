// frontend/src/pages/mog/LinkedPersonPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2, ChevronLeft, User, MapPin, Phone, Mail,
  Globe, Pill, FileText, ExternalLink, ImageIcon, X, ShieldAlert,
  ClipboardList, Users, Gavel, Activity, Shield, Navigation, Home,
  LayoutDashboard, Calendar, Pencil
} from "lucide-react";
import { mogService } from "../../services/mogService";

import FormModal from "../../components/mog/FormModal";
import AssessmentForm from "../../components/mog/AssessmentForm";
import FollowUpForm from "../../components/mog/FollowUpForm";
import TracingForm from "../../components/mog/TracingForm";
import HandoverForm from "../../components/mog/HandoverForm";
import VerificationForm from "../../components/mog/VerificationForm";
import OutreachForm from "../../components/mog/OutreachForm";
import TracingActionForm from "../../components/mog/TracingActionForm";
import CaseClosureForm from "../../components/mog/CaseClosureForm";

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
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const getRiskColor = (level) => {
  switch (level) {
    case "low":      return "bg-success/10 text-success border-success/20";
    case "moderate": return "bg-warning/10 text-warning border-warning/20";
    case "high":     return "bg-error/10 text-error border-error/20";
    case "critical": return "bg-error text-error-content border-error";
    default:         return "bg-base-200 text-base-content/60 border-base-300";
  }
};

const TABS = [
  { id: "overview",      label: "Overview",      icon: LayoutDashboard, key: "overview" },
  { id: "assessments",   label: "Assessments",   icon: ClipboardList, key: "assessments" },
  { id: "followups",     label: "Follow-ups",    icon: Activity,      key: "followups" },
  { id: "tracings",      label: "Family tracing",icon: Navigation,    key: "tracings" },
  { id: "verifications", label: "Verifications", icon: Shield,        key: "verifications" },
  { id: "handovers",     label: "Handovers",     icon: Users,         key: "handovers" },
  { id: "outreach",      label: "Community",     icon: Home,          key: "outreach" },
  { id: "tracingActions",label: "Tracing Actions",icon: MapPin,       key: "tracingActions" },
  { id: "caseClosures",  label: "Case closures", icon: Gavel,         key: "caseClosures" },
];

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <header className="flex items-center gap-2.5 border-b border-base-300 bg-base-200/40 px-4 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, value, fullWidth }) {
  return (
    <div className={`min-w-0 ${fullWidth ? "col-span-full" : ""}`}>
      <dt className="text-xs text-base-content/55">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function PhotoCard({ photo, name }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {photo ? (
        <>
          <button type="button" onClick={() => setOpen(true)} className="group relative size-40 overflow-hidden rounded-full border-[6px] border-white bg-base-200 shadow-sm ring-1 ring-base-300">
            <img src={photo} alt={name} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <ImageIcon className="size-7 text-white drop-shadow" />
            </span>
          </button>
          <p className="mt-3 text-xs text-base-content/50">Click to enlarge</p>
          {open && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onClick={() => setOpen(false)}>
              <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                <img src={photo} alt={name} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
                <button type="button" onClick={() => setOpen(false)} className="absolute -top-3 -right-3 rounded-full bg-base-100 p-1.5 text-base-content shadow-lg hover:bg-base-200" aria-label="Close"><X className="size-4" /></button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative flex size-40 items-end justify-center overflow-hidden rounded-full border-[6px] border-white bg-white shadow-sm ring-1 ring-base-300">
          <svg viewBox="0 0 24 24" fill="black" className="size-[110%] translate-y-2">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}
    </>
  );
}

export default function LinkedPersonPage() {
  const { personUuid } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (!personUuid) return;
    let cancelled = false;
    setLoading(true);
    mogService.person(personUuid)
      .then((r) => { if (!cancelled) setPerson(r); })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail || e.message || "Failed to load person."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [personUuid]);

  const fetchRecords = () => {
    if (!personUuid || activeTab === "overview") return;
    let cancelled = false;
    setRecordsLoading(true);
    const serviceKey = TABS.find(t => t.id === activeTab).key;
    
    mogService[serviceKey].list({ person: personUuid })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res.results || []);
        setRecords(list);
      })
      .catch(() => { if (!cancelled) setRecords([]); })
      .finally(() => { if (!cancelled) setRecordsLoading(false); });
      
    return () => { cancelled = true; };
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, personUuid]);

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="mx-auto mb-3 size-8 animate-spin text-primary" /></div>;
  }
  if (error || !person) {
    return <div className="p-8 text-center text-error">{error || "Person not found."}</div>;
  }

  const p = person;
  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/mog/people" className="grid size-8 place-items-center rounded-md hover:bg-base-200 text-base-content/60" title="Back to People">
          <ChevronLeft className="size-5" />
        </Link>
        <span className="text-sm font-medium text-base-content/60">Back to People</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm flex flex-col">
            <div className="flex flex-col items-center justify-center p-6 bg-base-200/30 border-b border-base-300">
              <PhotoCard photo={p.photo} name={p.full_name} />
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-center">{p.full_name}</h1>
              <p className="font-mono text-xs text-base-content/60 mt-1">{p.person_id}</p>
            </div>

            <div className="p-4 border-b border-base-300 bg-base-100">
              <h2 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="size-3.5" /> Demographics
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 pb-2 mb-1 border-b border-base-200">
                  <Row label="First Name" value={fmt(p.first_name)} />
                  <Row label="Middle Name" value={fmt(p.middle_name)} />
                  <Row label="Last Name" value={fmt(p.last_name)} />
                </div>
                <Row label="Gender" value={fmt(p.gender)} />
                <Row label="DOB" value={fmtDate(p.date_of_birth)} />
                <Row label="Nationality" value={fmt(p.nationality)} />
                <Row label="Marital Status" value={fmt(p.marital_status)} />
              </dl>
            </div>

            <div className="p-4 space-y-3 bg-base-200/10">
              <div className="flex items-center gap-2 text-sm"><Phone className="size-4 text-base-content/40" /><span className="truncate">{fmt(p.phone_number)}</span></div>
              <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-base-content/40" /><span className="truncate">{fmt(p.email)}</span></div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-base-content/40" /><span className="truncate">{fmt(p.address)}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex overflow-x-auto border-b border-base-300 hide-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive 
                      ? "border-primary text-primary bg-primary/5" 
                      : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[400px]">
            {activeTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel icon={MapPin} title="Incident Details">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <Row label="Incident Date" value={fmtDate(p.incident_date)} />
                    <Row label="Time" value={fmt(p.incident_time)} />
                    <Row label="Location" value={fmt(p.incident_location)} />
                    <Row label="County" value={fmt(p.incident_county)} />
                  </dl>
                </Panel>

                <Panel icon={Pill} title="Substance Use Profile">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <Row label="Primary Drug" value={fmt(p.type_of_drug_used)} />
                    <Row label="Frequency" value={fmt(p.frequency_of_use)} />
                    <Row label="Method" value={fmt(p.method_of_use)} />
                    <Row label="Dependency" value={fmt(p.dependency_level)} />
                    <Row label="Last Used" value={fmtDate(p.last_used_date)} />
                    <Row label="Age First Used" value={fmt(p.age_first_used)} />
                  </dl>
                </Panel>

                <Panel icon={ShieldAlert} title="Health & History">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <Row label="Overdose History" value={fmt(p.overdose_history)} />
                    <Row label="Overdose Count" value={fmt(p.overdose_count)} />
                    <Row label="Mental Health" value={fmt(p.mental_health_issues)} />
                    <Row label="Rehab History" value={fmt(p.rehab_history)} />
                    <Row label="Arrest Ref" value={fmt(p.arrest_reference)} />
                  </dl>
                </Panel>

                <Panel icon={Globe} title="Location & Background">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <Row label="County Resident" value={fmt(p.county_resident)} />
                    <Row label="District" value={fmt(p.district)} />
                    <Row label="Education" value={fmt(p.educational_level)} />
                    <Row label="Profession" value={fmt(p.professional_status)} />
                  </dl>
                </Panel>
                
                {p.rehab_details && (
                  <div className="md:col-span-2">
                    <Panel icon={FileText} title="Rehab Details">
                      <p className="whitespace-pre-wrap text-sm text-base-content/80">{p.rehab_details}</p>
                    </Panel>
                  </div>
                )}

                {p.remarks && (
                  <div className="md:col-span-2">
                    <Panel icon={FileText} title="Remarks">
                      <p className="whitespace-pre-wrap text-sm text-base-content/80">{p.remarks}</p>
                    </Panel>
                  </div>
                )}
              </div>
            ) : (
              recordsLoading ? (
                <div className="flex items-center justify-center h-40 text-base-content/50">
                  <Loader2 className="size-5 animate-spin mr-2" /> Loading records...
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((r) => {
                    // ===== FULL ASSESSMENT CARD =====
                    if (activeTab === "assessments") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <ClipboardList className="size-4 text-primary" />
                                {r.child_adult_code || `Assessment #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Registered: {fmtDate(r.registration_date)} | County: {fmt(r.county)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getRiskColor(r.risk_level)}`}>
                                {r.risk_level || "No Risk Assessed"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingRecord({ ...r, person_id: r.person?.person_id || p.person_id })
                                  setFormOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                              >
                                <Pencil className="size-3" /> Edit
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Basic & Eligibility</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Eligibility Met" value={fmt(r.case_meets_eligibility)} />
                                <Row label="Consent Given" value={fmt(r.consent_assent_completed)} />
                                <Row label="Reporting Agency" value={fmt(r.reporting_agency)} />
                                <Row label="Languages Spoken" value={fmt(r.languages_spoken)} />
                                <Row label="Special Comm. Needs" value={fmt(r.special_communication_needs)} fullWidth />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Father</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="Name" value={fmt(r.father_name)} />
                                  <Row label="Status" value={fmt(r.father_status)} />
                                  <Row label="DOB" value={fmtDate(r.father_date_of_birth)} />
                                  <Row label="Nationality" value={fmt(r.father_nationality)} />
                                  <Row label="County Origin" value={fmt(r.father_county_origin)} />
                                  <Row label="District Origin" value={fmt(r.father_district_origin)} />
                                  <Row label="Contact" value={fmt(r.father_contact)} />
                                  <Row label="Address" value={fmt(r.father_address)} />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Mother</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="Name" value={fmt(r.mother_name)} />
                                  <Row label="Status" value={fmt(r.mother_status)} />
                                  <Row label="DOB" value={fmtDate(r.mother_date_of_birth)} />
                                  <Row label="Nationality" value={fmt(r.mother_nationality)} />
                                  <Row label="County Origin" value={fmt(r.mother_county_origin)} />
                                  <Row label="District Origin" value={fmt(r.mother_district_origin)} />
                                  <Row label="Contact" value={fmt(r.mother_contact)} />
                                  <Row label="Address" value={fmt(r.mother_address)} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Care Arrangement</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="Arrangement Type" value={fmt(r.care_arrangement)} />
                                <Row label="Caregiver Name" value={fmt(r.care_full_names)} />
                                <Row label="DOB" value={fmtDate(r.care_date_birth)} />
                                <Row label="Gender" value={fmt(r.care_gender)} />
                                <Row label="Nationality" value={fmt(r.care_nationality)} />
                                <Row label="Town of Origin" value={fmt(r.care_town_of_origin)} />
                                <Row label="Contact" value={fmt(r.care_contact_number)} />
                                <Row label="Current Address" value={fmt(r.care_current_address)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Protection & Risk</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Risk Summary" value={fmt(r.risk_summary)} fullWidth />
                                <Row label="Protection Concerns" value={fmt(r.protection_concerns)} fullWidth />
                                <Row label="Physical Disability" value={fmt(r.physical_disability)} />
                                <Row label="Mental Illness" value={fmt(r.mental_illness)} />
                                <Row label="Substances Abuse" value={fmt(r.substances_abuse)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Immediate Concerns & Case History</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Immediate Concern" value={fmt(r.immediate_concern)} />
                                <Row label="Immediate Reason" value={fmt(r.immediate_reason)} />
                                <Row label="Immediate Action Taken" value={fmt(r.immediate_action_taken)} fullWidth />
                                <Row label="Case History" value={fmt(r.case_history)} fullWidth />
                                <Row label="Recommended Next Steps" value={fmt(r.recommended_next_steps)} fullWidth />
                                <Row label="First Documented" value={fmt(r.first_documented)} />
                                <Row label="Location Status" value={fmt(r.location_status)} />
                                <Row label="Next Up Date" value={fmtDate(r.next_up_date)} />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-base-200">
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">Staff Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-base-content/60">
                                <div>Professional: <strong className="block text-base-content/80 mt-0.5">{fmt(r.professional_name)}</strong></div>
                                <div>Cell: <strong className="block text-base-content/80 mt-0.5">{fmt(r.professional_cell)}</strong></div>
                                <div>Supervisor: <strong className="block text-base-content/80 mt-0.5">{fmt(r.supervisor_name)}</strong></div>
                                <div>Cell: <strong className="block text-base-content/80 mt-0.5">{fmt(r.supervisor_cell)}</strong></div>
                                <div className="col-span-full">Signature: <strong className="block text-base-content/80 mt-0.5">{fmt(r.social_worker_signature)}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL FOLLOW-UP CARD =====
                    if (activeTab === "followups") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="size-4 text-primary" />
                                {r.child_code || `Follow-up #${r.visit_number || r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Visit Date: {fmtDate(r.visit_date)} | County: {fmt(r.visit_county || r.county)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Visit Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Visit #" value={fmt(r.visit_number)} />
                                <Row label="Date" value={fmtDate(r.visit_date)} />
                                <Row label="Child Seen" value={fmt(r.child_seen)} />
                                <Row label="Seen Alone" value={fmt(r.seen_alone)} />
                                <Row label="Previous Visit" value={fmtDate(r.previous_followup_date)} />
                                <Row label="Action Followed" value={fmt(r.action_followed)} />
                                <Row label="Situation Change" value={fmt(r.situation_change)} />
                                <Row label="Action Conducted" value={fmt(r.action_conducted)} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Location</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="House" value={fmt(r.location_house)} />
                                  <Row label="Street" value={fmt(r.street)} />
                                  <Row label="Town" value={fmt(r.town)} />
                                  <Row label="District" value={fmt(r.district)} />
                                  <Row label="County" value={fmt(r.county)} />
                                  <Row label="Country" value={fmt(r.country)} />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Caregiver</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="Name" value={fmt(r.caregiver_name)} />
                                  <Row label="Relationship" value={fmt(r.caregiver_relationship)} />
                                  <Row label="Contact" value={fmt(r.contact_number)} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Follow-up Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Purpose" value={fmt(r.purpose_of_followup)} fullWidth />
                                <Row label="Details" value={fmt(r.followup_details)} fullWidth />
                                <Row label="Action Service" value={fmt(r.action_service)} fullWidth />
                                <Row label="Protection Issues" value={fmt(r.protection_issues)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Psych & Health</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Appearance" value={fmt(r.appearance)} />
                                <Row label="Health Status" value={fmt(r.health_status)} />
                                <Row label="Frequently Sick" value={fmt(r.frequently_sick)} />
                                <Row label="Psychological Notes" value={fmt(r.psychological_notes)} />
                                <Row label="Health Notes" value={fmt(r.health_notes)} />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-base-200">
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">Caseworker</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-base-content/60">
                                <div>Name: <strong className="block text-base-content/80 mt-0.5">{fmt(r.caseworker_name)}</strong></div>
                                <div>Agency: <strong className="block text-base-content/80 mt-0.5">{fmt(r.agency)}</strong></div>
                                <div>Signature: <strong className="block text-base-content/80 mt-0.5">{fmt(r.signature)}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL TRACING CARD =====
                    if (activeTab === "tracings") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Navigation className="size-4 text-primary" />
                                {r.child_code || `Tracing #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                County: {fmt(r.follow_county)} | Center: {fmt(r.center_type)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Basic & Family History</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Separated Child" value={fmt(r.separated_child)} />
                                <Row label="Mother" value={fmt(r.mother_name)} />
                                <Row label="Mother Alive" value={fmt(r.mother_alive)} />
                                <Row label="Father" value={fmt(r.father_name)} />
                                <Row label="Father Alive" value={fmt(r.father_alive)} />
                                <Row label="Guardian Alive" value={fmt(r.guardian_alive)} />
                                <Row label="Parent Status" value={fmt(r.parent_status)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Address Before Separation</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="House" value={fmt(r.house_location)} />
                                <Row label="Street" value={fmt(r.street)} />
                                <Row label="Town" value={fmt(r.town)} />
                                <Row label="District" value={fmt(r.district)} />
                                <Row label="County" value={fmt(r.county)} />
                                <Row label="Country" value={fmt(r.country)} />
                                <Row label="Address Info" value={fmt(r.address_information)} fullWidth />
                                <Row label="Child Life Info" value={fmt(r.child_life_information)} fullWidth />
                                <Row label="Memorable Events" value={fmt(r.child_memorable_events)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Evidence & Separation</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Child ID Evidence" value={fmt(r.child_id_evidence)} />
                                <Row label="Birth Cert Evidence" value={fmt(r.birth_certificate_evidence)} />
                                <Row label="Photos Evidence" value={fmt(r.photos_evidence)} />
                                <Row label="Other Evidence" value={fmt(r.other_evidence)} />
                                <Row label="Separation Date" value={fmtDate(r.separation_date)} />
                                <Row label="Separated From" value={fmt(r.separated_from_name)} />
                                <Row label="Relationship" value={fmt(r.relationship_to_child)} />
                                <Row label="Separation Address" value={fmt(r.separation_address)} />
                                <Row label="Circumstances" value={fmt(r.separation_circumstances)} />
                                <Row label="Main Cause" value={fmt(r.main_cause_of_separation)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Traced Family Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="Traced Person" value={fmt(r.traced_person_name)} />
                                <Row label="Age" value={fmt(r.traced_person_age)} />
                                <Row label="Gender" value={fmt(r.traced_person_gender)} />
                                <Row label="Contact" value={fmt(r.traced_person_contact)} />
                                <Row label="Relationship" value={fmt(r.traced_person_relationship)} />
                                <Row label="Occupation" value={fmt(r.traced_person_occupation)} />
                                <Row label="Wants Child" value={fmt(r.wants_child)} />
                                <Row label="Able to Care" value={fmt(r.able_to_take_care)} />
                                <Row label="Alt Family Available" value={fmt(r.alternative_family_available)} />
                                <Row label="Agreement Take Child" value={fmt(r.agreement_take_child)} />
                                <Row label="Signature Name" value={fmt(r.signature_name)} />
                              </div>
                            </div>
                            
                            {r.family_members && r.family_members.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Listed Family Members</h4>
                                <ul className="list-disc pl-4 space-y-1 text-sm">
                                  {r.family_members.map((m, i) => (
                                    <li key={i}><strong>{m.name}</strong> ({m.relationship}) - {fmt(m.address)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Observations & Staff</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Child Return Info" value={fmt(r.child_return_information)} fullWidth />
                                <Row label="Caseworker Obs" value={fmt(r.caseworker_observation)} fullWidth />
                                <Row label="Caseworker Name" value={fmt(r.caseworker_name)} />
                                <Row label="Date" value={fmtDate(r.caseworker_date)} />
                                <Row label="Organization" value={fmt(r.organization)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL HANDOVER CARD =====
                    if (activeTab === "handovers") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Users className="size-4 text-primary" />
                                {r.reunification_type || `Handover #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Date: {fmtDate(r.reunification_date)} | Place: {fmt(r.reunification_place)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Verification & Reunification</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Adult Verified" value={fmt(r.adult_verification)} />
                                <Row label="Child Verified" value={fmt(r.child_verification)} />
                                <Row label="Relationship Verified" value={fmt(r.relationship_verified)} />
                                <Row label="Ongoing Support" value={fmt(r.ongoing_support_needed)} />
                                <Row label="Follow-up County" value={fmt(r.follow_county)} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Caregiver 1</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="Name" value={fmt(r.caregiver1_name)} />
                                  <Row label="Sex" value={fmt(r.caregiver1_sex)} />
                                  <Row label="Relationship" value={fmt(r.caregiver1_relationship)} />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Caregiver 2</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Row label="Name" value={fmt(r.caregiver2_name)} />
                                  <Row label="Sex" value={fmt(r.caregiver2_sex)} />
                                  <Row label="Relationship" value={fmt(r.caregiver2_relationship)} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Address</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="Address" value={fmt(r.address)} />
                                <Row label="Phone" value={fmt(r.phone)} />
                                <Row label="Town/Village" value={fmt(r.town_village)} />
                                <Row label="Clan" value={fmt(r.clan)} />
                                <Row label="District" value={fmt(r.district)} />
                                <Row label="County" value={fmt(r.county)} />
                                <Row label="Country" value={fmt(r.country)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Agreements & Signatures</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Consent Person" value={fmt(r.consent_person)} />
                                <Row label="Child Name" value={fmt(r.child_name)} />
                                <Row label="Agreement Statement" value={fmt(r.agreement_statement)} fullWidth />
                                <Row label="Caseworker Signature" value={fmt(r.caseworker_signature)} />
                                <Row label="Receiver Signature" value={fmt(r.receiver_signature)} />
                                <Row label="Witness Signature" value={fmt(r.witness_signature)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Additional Info & Staff</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="New Address Location" value={fmt(r.new_address_location)} />
                                <Row label="Siblings Reunified" value={fmt(r.siblings_reunified)} />
                                <Row label="Signature Date" value={fmtDate(r.signature_date)} />
                                <Row label="Signature Place" value={fmt(r.signature_place)} />
                                <Row label="Additional Information" value={fmt(r.additional_information)} fullWidth />
                                <Row label="Caseworker Name" value={fmt(r.caseworker_name)} />
                                <Row label="Organization" value={fmt(r.organization)} />
                                <Row label="Supervisor Name" value={fmt(r.supervisor_name)} />
                                <Row label="Supervisor Position" value={fmt(r.supervisor_position)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL VERIFICATION CARD =====
                    if (activeTab === "verifications") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Shield className="size-4 text-primary" />
                                {r.child_code || `Verification #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Date: {fmtDate(r.date_completed)} | County: {fmt(r.follow_county)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Verification Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Match Case" value={fmt(r.match_case)} />
                                <Row label="Child Knows Adult" value={fmt(r.child_knows_adult)} />
                                <Row label="Recognize Photos" value={fmt(r.recognize_photos)} />
                                <Row label="Case ID Number" value={fmt(r.case_id_number)} />
                                <Row label="Discrepancies" value={fmt(r.discrepancies)} fullWidth />
                                <Row label="Child Comments" value={fmt(r.child_comments)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Wishes & Recommendation</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Need Info" value={fmt(r.need_info)} />
                                <Row label="Info Provided" value={fmt(r.info_provided)} />
                                <Row label="Wants Reunification" value={fmt(r.wants_reunification)} />
                                <Row label="Recommendation" value={fmt(r.recommendation)} />
                                <Row label="Child Wishes Comments" value={fmt(r.child_wishes_comments)} fullWidth />
                                <Row label="Recommendation Reason" value={fmt(r.recommendation_reason)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Address & Caregiver</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="Current Address" value={fmt(r.current_address)} />
                                <Row label="Caregiver Name" value={fmt(r.caregiver_name)} />
                                <Row label="Before Separation Address" value={fmt(r.before_separation_address)} />
                                <Row label="Street" value={fmt(r.street)} />
                                <Row label="Town" value={fmt(r.town)} />
                                <Row label="District" value={fmt(r.district)} />
                                <Row label="County" value={fmt(r.county)} />
                                <Row label="Country" value={fmt(r.country)} />
                                <Row label="Other Address Info" value={fmt(r.other_address_info)} fullWidth />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-base-200">
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">Caseworker</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-base-content/60">
                                <div>Name: <strong className="block text-base-content/80 mt-0.5">{fmt(r.caseworker_name)}</strong></div>
                                <div>Date: <strong className="block text-base-content/80 mt-0.5">{fmtDate(r.caseworker_date)}</strong></div>
                                <div>Organization: <strong className="block text-base-content/80 mt-0.5">{fmt(r.organization)}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL COMMUNITY OUTREACH CARD =====
                    if (activeTab === "outreach") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Home className="size-4 text-primary" />
                                {r.activity_type || `Outreach #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Report Date: {fmtDate(r.reporting_date)} | County: {fmt(r.follow_county)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Reporting Metadata</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Reporting Period" value={fmt(r.reporting_period)} />
                                <Row label="Organization" value={fmt(r.organization)} />
                                <Row label="County/District/Community" value={fmt(r.county_district_community)} />
                                <Row label="Outreach Officer" value={fmt(r.outreach_officer)} />
                                <Row label="Contact Information" value={fmt(r.contact_information)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Activity Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Activity Date" value={fmtDate(r.activity_date)} />
                                <Row label="Community Location" value={fmt(r.community_location)} />
                                <Row label="Target Group" value={fmt(r.target_group)} />
                                <Row label="Number Reached" value={fmt(r.number_reached)} />
                                <Row label="Key Issues Identified" value={fmt(r.key_issues_identified)} fullWidth />
                                <Row label="Topics Discussed" value={fmt(r.topics_discussed)} fullWidth />
                                <Row label="Community Concerns" value={fmt(r.community_concerns)} fullWidth />
                                <Row label="Risk Factors" value={fmt(r.risk_factors)} fullWidth />
                                <Row label="Immediate Needs" value={fmt(r.immediate_needs)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Follow-up & Progress</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Follow-up Type" value={fmt(r.followup_type)} />
                                <Row label="Next Follow-up Date" value={fmtDate(r.next_followup_date)} />
                                <Row label="Follow-up Details" value={fmt(r.followup_details)} fullWidth />
                                <Row label="Progress Observed" value={fmt(r.progress_observed)} fullWidth />
                                <Row label="Challenges Identified" value={fmt(r.challenges_identified)} fullWidth />
                                <Row label="Action Taken" value={fmt(r.action_taken)} fullWidth />
                                <Row label="Emotional Condition" value={fmt(r.emotional_condition)} />
                                <Row label="Family Support Status" value={fmt(r.family_support_status)} />
                                <Row label="School Attendance" value={fmt(r.school_attendance)} />
                                <Row label="Behavioral Improvement" value={fmt(r.behavioral_improvement)} />
                                <Row label="Additional Support Needed" value={fmt(r.additional_support_needed)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Referral Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                                <Row label="Referral Date" value={fmtDate(r.referral_date)} />
                                <Row label="Referred By" value={fmt(r.referred_by)} />
                                <Row label="Receiving Institution" value={fmt(r.receiving_institution)} />
                                <Row label="Contact Person" value={fmt(r.contact_person)} />
                                <Row label="Contact Number" value={fmt(r.contact_number)} />
                                <Row label="Reason for Referral" value={fmt(r.reason_for_referral)} fullWidth />
                                <Row label="Services Accessed" value={fmt(r.services_accessed)} fullWidth />
                                <Row label="Feedback from Provider" value={fmt(r.feedback_from_provider)} fullWidth />
                                <Row label="Outcome" value={fmt(r.outcome)} fullWidth />
                                <Row label="Follow-up Needed" value={fmt(r.followup_needed)} fullWidth />
                                <Row label="Challenges" value={fmt(r.challenges)} fullWidth />
                                <Row label="Recommendation" value={fmt(r.recommendation)} fullWidth />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-base-200">
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">Assessment / Interview Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-base-content/60">
                                <div>Institution: <strong className="block text-base-content/80 mt-0.5">{fmt(r.institution_name)}</strong></div>
                                <div>Location: <strong className="block text-base-content/80 mt-0.5">{fmt(r.location)}</strong></div>
                                <div>Date/Time: <strong className="block text-base-content/80 mt-0.5">{fmtDate(r.assessment_datetime)}</strong></div>
                                <div>Interviewee: <strong className="block text-base-content/80 mt-0.5">{fmt(r.interviewee_name)}</strong></div>
                                <div>Position: <strong className="block text-base-content/80 mt-0.5">{fmt(r.interviewee_position)}</strong></div>
                                <div>Contact: <strong className="block text-base-content/80 mt-0.5">{fmt(r.interviewee_contact)}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL TRACING ACTIONS CARD =====
                    if (activeTab === "tracingActions") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <MapPin className="size-4 text-primary" />
                                {r.caseworker_name || `Tracing Action #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Date: {fmtDate(r.caseworker_date)} | County: {fmt(r.follow_county)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Parent Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Caseworker Signature" value={fmt(r.caseworker_signature)} />
                                <Row label="Tracing Notes" value={fmt(r.tracing_notes)} fullWidth />
                              </div>
                            </div>

                            {r.actions && r.actions.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Individual Actions</h4>
                                <div className="space-y-4">
                                  {r.actions.map((a, i) => (
                                    <div key={i} className="bg-base-200/30 p-3 rounded-lg border border-base-200">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                                        <Row label="Action Taken" value={fmt(a.action_taken)} />
                                        <Row label="Provider Details" value={fmt(a.provider_details)} />
                                        <Row label="Individual Traced" value={fmt(a.individual_traced)} />
                                        <Row label="Tracing Outcome" value={fmt(a.tracing_outcome)} />
                                        <Row label="Location" value={fmt(a.tracing_location)} />
                                        <Row label="Due Date" value={fmtDate(a.due_date)} />
                                      </div>
                                      <div className="mt-2">
                                        <Row label="Tracing Details" value={fmt(a.tracing_details)} fullWidth />
                                        <Row label="Next Steps" value={fmt(a.next_steps)} fullWidth />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL CASE CLOSURE CARD =====
                    if (activeTab === "caseClosures") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Gavel className="size-4 text-primary" />
                                {r.case_id_number || `Closure #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Date Closed: {fmtDate(r.date_case_closed)} | Weeks Open: {fmt(r.case_opened_weeks)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md bg-base-200 px-3 py-1.5 text-xs font-medium hover:bg-base-300 shadow-sm"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Basic & Reason</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Primary Reason" value={fmt(r.primary_reason)} />
                                <Row label="Follow-up County" value={fmt(r.follow_county)} />
                                <Row label="Closure Reason Details" value={fmt(r.closure_reason_details)} fullWidth />
                                <Row label="Current Case Summary" value={fmt(r.current_case_summary)} fullWidth />
                                <Row label="Closure Process" value={fmt(r.closure_process)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Caregiver & Address</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                <Row label="Caregiver" value={fmt(r.caregiver_name)} />
                                <Row label="Relationship" value={fmt(r.caregiver_relationship)} />
                                <Row label="Phone" value={fmt(r.caregiver_phone)} />
                                <Row label="County" value={fmt(r.county)} />
                                <Row label="District" value={fmt(r.district)} />
                                <Row label="Community" value={fmt(r.community)} />
                                <Row label="Street" value={fmt(r.street)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Agreements & Files</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Row label="Child Agreed" value={fmt(r.child_agreed)} />
                                <Row label="Child Reason" value={fmt(r.child_reason)} />
                                <Row label="Caregiver Agreed" value={fmt(r.caregiver_agreed)} />
                                <Row label="Caregiver Reason" value={fmt(r.caregiver_reason)} />
                                <Row label="Followup Planned" value={fmt(r.followup_planned)} />
                                <Row label="Followup Reason" value={fmt(r.followup_reason)} />
                                <Row label="File Complete" value={fmt(r.file_complete)} />
                                <Row label="File Complete Reason" value={fmt(r.file_complete_reason)} />
                                <Row label="Storage Method" value={fmt(r.storage_method)} />
                                <Row label="File Storage Until" value={fmtDate(r.file_storage_until)} />
                                <Row label="Child Informed" value={fmt(r.child_informed)} />
                                <Row label="Child Informed Reason" value={fmt(r.child_informed_reason)} />
                                <Row label="Contact Person Details" value={fmt(r.contact_person_details)} fullWidth />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-base-200">
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">Caseworker</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-base-content/60">
                                <div>Name: <strong className="block text-base-content/80 mt-0.5">{fmt(r.caseworker_name)}</strong></div>
                                <div>Phone: <strong className="block text-base-content/80 mt-0.5">{fmt(r.caseworker_phone)}</strong></div>
                                <div>Signature: <strong className="block text-base-content/80 mt-0.5">{fmt(r.caseworker_signature)}</strong></div>
                              </div>
                            </div>

                            {r.approvals && r.approvals.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Closure Approvals</h4>
                                <div className="space-y-3">
                                  {r.approvals.map((a, i) => (
                                    <div key={i} className="bg-base-200/30 p-3 rounded-lg border border-base-200 grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                                      <Row label="Role" value={fmt(a.role)} />
                                      <Row label="Name" value={fmt(a.name)} />
                                      <Row label="Agency" value={fmt(a.agency)} />
                                      <Row label="Signature" value={fmt(a.signature)} />
                                      <Row label="Contact Details" value={fmt(a.contact_details)} fullWidth />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // ===== GENERIC FALLBACK FOR OTHER TABS =====
                    return (
                      <div key={r.id} className="p-4 rounded-lg border border-base-300 bg-base-100 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{r.child_adult_code || r.case_id_number || `Record #${r.id}`}</p>
                          <p className="text-xs text-base-content/60">{fmtDate(r.registration_date || r.visit_date || r.created_at)}</p>
                        </div>
                        <Link to="#" className="text-primary text-xs hover:underline">View Details</Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-base-300 bg-base-200/30 p-6 text-center">
                  <ActiveIcon className="size-10 text-base-content/20 mb-3" />
                  <h3 className="text-sm font-medium text-base-content">No {TABS.find(t => t.id === activeTab)?.label} found</h3>
                  <p className="text-xs text-base-content/60 mt-1 mb-4">
                    This person does not have any {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} recorded yet.
                  </p>
                  <button
                    onClick={() => {
                      setEditingRecord(null);
                      setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110 shadow-sm"
                  >
                    Add {TABS.find(t => t.id === activeTab)?.label}
                  </button>
                </div>
              )
            )}
          </div>

        </div>
      </div>

      <FormModal
        title={`${editingRecord ? "Edit" : "New"} ${TABS.find(t => t.id === activeTab)?.label}`}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRecord(null);
        }}
      >
        {activeTab === "assessments" && (
          <AssessmentForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "followups" && (
          <FollowUpForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "tracings" && (
          <TracingForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "handovers" && (
          <HandoverForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "verifications" && (
          <VerificationForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "outreach" && (
          <OutreachForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "tracingActions" && (
          <TracingActionForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab === "caseClosures" && (
          <CaseClosureForm
            initial={editingRecord || { person_id: p.person_id }}
            onSaved={() => {
              setFormOpen(false);
              setEditingRecord(null);
              fetchRecords();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
        {activeTab !== "assessments" && activeTab !== "followups" && activeTab !== "tracings" && activeTab !== "handovers" && activeTab !== "verifications" && activeTab !== "outreach" && activeTab !== "tracingActions" && activeTab !== "caseClosures" && activeTab !== "overview" && (
          <div className="p-8 text-center text-base-content/50">
            Form for {TABS.find(t => t.id === activeTab)?.label} not built yet.
          </div>
        )}
      </FormModal>

    </div>
  );
}