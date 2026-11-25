// frontend/src/pages/moys/Beneficiary/BeneficiaryDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft, Loader2, User, MapPin, Pill, ShieldAlert, ClipboardList,
  FileText, Briefcase, GraduationCap, HeartHandshake, Activity, FileCheck, LayoutDashboard,
  Phone, Mail, Calendar, Globe, FileSignature, Edit, AlertCircle, Clock
} from "lucide-react";
import { moysService } from "../../../services/moysService";

// Components
import FormModal from "../../../components/mog/FormModal";
import MYSReferralForm from "../../../components/moys/MYSReferralForm";
import MYSReceiptForm from "../../../components/moys/MYSReceiptForm";
import MYSPreTreatmentForm from "../../../components/moys/MYSPreTreatmentForm";
import MYSARYEPForm from "../../../components/moys/MYSARYEPForm";
import MYSReintegrationPlanForm from "../../../components/moys/MYSReintegrationPlanForm";
import MYSTVETForm from "../../../components/moys/MYSTVETForm";
import MYSInterventionForm from "../../../components/moys/MYSInterventionForm";
import MYSEmploymentForm from "../../../components/moys/MYSEmploymentForm";
import MYSFamilyReintegrationForm from "../../../components/moys/MYSFamilyReintegrationForm";
import MYSFollowUpForm from "../../../components/moys/MYSFollowUpForm";
import MYSCaseClosureForm from "../../../components/moys/MYSCaseClosureForm";
import MYSServiceProviderForm from "../../../components/moys/MYSServiceProviderForm";

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

const normalizeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }
  return [];
};

const TABS = [
  { id: "overview",             label: "Overview",             icon: LayoutDashboard, key: "overview" },
  { id: "referrals",            label: "Referrals",            icon: FileText,        key: "referrals" },
  { id: "receipts",             label: "Receipts",             icon: FileCheck,       key: "receipts" },
  { id: "preTreatment",         label: "Pre-Treatment",        icon: Activity,        key: "preTreatment" },
  { id: "aryep",                label: "ARYEP",                icon: GraduationCap,   key: "aryep" },
  { id: "plans",                label: "Reintegration Plans",  icon: ClipboardList,   key: "plans" },
  { id: "tvet",                 label: "TVET / Skills",        icon: Briefcase,       key: "tvet" },
  { id: "interventions",        label: "Interventions",        icon: HeartHandshake,  key: "interventions" },
  { id: "employment",           label: "Employment",           icon: Briefcase,       key: "employment" },
  { id: "familyReintegration",  label: "Family Reintegration", icon: User,            key: "familyReintegration" },
  { id: "followUps",            label: "Follow-ups",           icon: Activity,        key: "followUps" },
  { id: "caseClosures",         label: "Case Closures",        icon: FileCheck,       key: "caseClosures" },
  { id: "serviceProviders",     label: "Service Providers",    icon: Briefcase,       key: "serviceProviders" },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-base-content/80 border-b border-base-200 pb-2">
        <Icon className="size-4 text-primary" /> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, fullWidth }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-0.5">{label}</p>
      <p className="font-medium text-base-content/90 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function CompactField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="size-4 text-base-content/40 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-base-content/50">{label}</p>
        <p className="font-medium text-base-content/80 truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, fallback = "In Progress" }) {
  const raw = (status || fallback).toString();
  const key = raw.toLowerCase().replace(/[-\s]/g, "_");

  const styles =
    key === "completed" || key === "closed" || key === "done" || key === "accepted" || key === "yes" || key === "operating" || key === "reunited" || key === "stable" || key === "progressing" || key === "reintegrated"
      ? "bg-success/10 text-success border-success/20"
      : key === "in_progress" || key === "ongoing" || key === "active"
      ? "bg-info/10 text-info border-info/30"
      : key === "pending" || key === "waiting" || key === "needs_support" || key === "partially_reintegrated"
      ? "bg-warning/10 text-warning border-warning/20"
      : key === "cancelled" || key === "rejected" || key === "failed" || key === "returned" || key === "no" || key === "permanently_closed" || key === "dropped_out"
      ? "bg-error/10 text-error border-error/20"
      : "bg-base-200 text-base-content/60 border-base-300";

  const label = key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {key === "in_progress" && <Clock className="size-3" />}
      {label}
    </span>
  );
}

const renderList = (list) => {
  if (!list) return <span className="text-xs text-base-content/40">—</span>;
  
  let parsedList = list;
  
  if (typeof list === "string") {
    try {
      parsedList = JSON.parse(list);
    } catch {
      return <span className="text-xs text-base-content/40">{list}</span>;
    }
  }

  if (!Array.isArray(parsedList) || parsedList.length === 0) {
    return <span className="text-xs text-base-content/40">No records.</span>;
  }

  if (typeof parsedList[0] === "object" && parsedList[0] !== null) {
    const keys = Object.keys(parsedList[0]);

    return (
      <div className="overflow-x-auto w-full mt-2">
        <table className="w-full text-xs text-left border-collapse border border-base-400 bg-base-100">
          <thead>
            <tr className="bg-base-200">
              {keys.map((k) => (
                <th key={k} className="border border-base-400 p-2 font-bold uppercase tracking-wider text-base-content/80 text-center">
                  {k.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedList.map((row, i) => (
              <tr key={i} className="hover:bg-base-200/30 transition-colors">
                {keys.map((k) => (
                  <td key={k} className="border border-base-400 p-2 text-base-content/90 text-left">
                    {String(row[k] || "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ul className="list-disc pl-4 space-y-1 text-xs">
      {parsedList.map((item, i) => (
        <li key={i}>{String(item)}</li>
      ))}
    </ul>
  );
};

export default function MOYSBeneficiaryDetailPage() {
  const { personUuid } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [editingPreTreatment, setEditingPreTreatment] = useState(null);
  const [editingARYEP, setEditingARYEP] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingTVET, setEditingTVET] = useState(null);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [editingEmployment, setEditingEmployment] = useState(null);
  const [editingFamily, setEditingFamily] = useState(null);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editingCaseClosure, setEditingCaseClosure] = useState(null);
  const [editingServiceProvider, setEditingServiceProvider] = useState(null);
  const [showProfileEditInfo, setShowProfileEditInfo] = useState(false);

  useEffect(() => {
    if (!personUuid) return;
    let cancelled = false;
    setLoading(true);
    moysService.person(personUuid)
      .then((data) => { if (!cancelled) setPerson(data); })
      .catch(() => { if (!cancelled) setPerson(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [personUuid]);

  const fetchRecords = () => {
    if (!personUuid || activeTab === "overview") return;
    let cancelled = false;
    setRecordsLoading(true);
    const serviceKey = TABS.find(t => t.id === activeTab).key;

    moysService[serviceKey].list({ person: personUuid })
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

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!person) return <div className="p-8 text-center text-error">Person not found.</div>;

  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-12">

      <div className="flex flex-wrap items-center gap-3">
        <Link to="/moys/people" className="grid size-8 place-items-center rounded-md hover:bg-base-200 text-base-content/60" title="Back to People">
          <ChevronLeft className="size-5" />
        </Link>
        <span className="text-sm font-medium text-base-content/60">Back to Beneficiaries</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left Column: Profile & Demographics */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm flex flex-col">

            <div className="flex flex-col items-center justify-center p-6 bg-base-200/30 border-b border-base-300">
              <div className="grid size-32 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-base-100 bg-primary/10 text-3xl font-bold text-primary shadow-sm">
                {person.photo ? <img src={person.photo} alt="" className="size-full object-cover" /> : person.first_name?.[0]}
              </div>

              <h1 className="mt-4 text-xl font-semibold text-center">
                {[person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ")}
              </h1>

              <div className="mt-3 text-center flex flex-col items-center">
                <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-content shadow-sm">
                  ID: {person.id}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4 bg-base-100">
              <div className="flex items-center justify-between gap-2 border-b border-base-200 pb-2">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary shrink-0">
                  <User className="size-4" /> Demographics & Contact
                </h3>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={person.status || person.case_status} fallback="In Progress" />
                  <button
                    type="button"
                    onClick={() => setShowProfileEditInfo(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                    title="Edit Beneficiary"
                  >
                    <Edit className="size-3" /> Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <CompactField icon={Phone} label="Phone" value={fmt(person.phone_number)} />
                <CompactField icon={Mail} label="Email" value={fmt(person.email)} />
                <CompactField icon={Calendar} label="Date of Birth / Age" value={`${fmtDate(person.date_of_birth)} (${fmt(person.age)} yrs)`} />
                <CompactField icon={Globe} label="Marital Status" value={fmt(person.marital_status)} />
                <CompactField icon={MapPin} label="County" value={fmt(person.county_resident)} />
                <CompactField icon={MapPin} label="District" value={fmt(person.district)} />
                <CompactField icon={MapPin} label="Address" value={fmt(person.address)} />
                <CompactField icon={GraduationCap} label="Education" value={fmt(person.educational_level)} />
                <CompactField icon={Briefcase} label="Profession" value={fmt(person.professional_status)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="lg:col-span-3 space-y-4">

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

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Section icon={MapPin} title="Incident Information">
                  <Field label="Incident Date" value={fmtDate(person.incident_date)} />
                  <Field label="Incident Time" value={fmt(person.incident_time)} />
                  <Field label="Incident Location" value={fmt(person.incident_location)} />
                  <Field label="Incident County" value={fmt(person.incident_county)} />
                </Section>

                <Section icon={Pill} title="Substance Use Profile">
                  <Field label="Type of Drug" value={fmt(person.type_of_drug_used)} />
                  <Field label="Frequency" value={fmt(person.frequency_of_use)} />
                  <Field label="Method" value={fmt(person.method_of_use)} />
                  <Field label="Dependency" value={fmt(person.dependency_level)} />
                  <Field label="Age First Used" value={fmt(person.age_first_used)} />
                  <Field label="Last Used" value={fmtDate(person.last_used_date)} />
                </Section>

                <div className="xl:col-span-2">
                  <Section icon={ShieldAlert} title="Health & History">
                    <Field label="Overdose History" value={fmt(person.overdose_history)} />
                    <Field label="Overdose Count" value={fmt(person.overdose_count)} />
                    <Field label="Mental Health Issues" value={fmt(person.mental_health_issues)} />
                    <Field label="Rehab History" value={fmt(person.rehab_history)} />
                    <Field label="Arrest Reference" value={fmt(person.arrest_reference)} />
                    <Field label="Rehab Details" value={fmt(person.rehab_details)} fullWidth />
                    <Field label="Remarks" value={fmt(person.remarks)} fullWidth />
                  </Section>
                </div>
              </div>

            ) : (

              recordsLoading ? (
                <div className="flex items-center justify-center h-40 text-base-content/50">
                  <Loader2 className="size-5 animate-spin mr-2" /> Loading records...
                </div>
              ) : records.length > 0 ? (
                <div className={`grid gap-4 ${activeTab === "referrals" || activeTab === "receipts" || activeTab === "preTreatment" || activeTab === "aryep" || activeTab === "plans" || activeTab === "tvet" || activeTab === "interventions" || activeTab === "employment" || activeTab === "familyReintegration" || activeTab === "followUps" || activeTab === "caseClosures" || activeTab === "serviceProviders" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                  {records.map((r) => {

                    // ===== FULL DETAIL CARD FOR REFERRALS =====
                    if (activeTab === "referrals") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                {r.referral_id || `Referral #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Date: {fmtDate(r.date_of_referral)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.referral_status} fallback="pending" />
                              <button
                                type="button"
                                onClick={() => setEditingReferral(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Source & Contact</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Referral Source" value={r.referral_source ? r.referral_source.replace("_", " ") : "—"} />
                                <Field label="Referring Person/Inst." value={fmt(r.referring_institution_person)} />
                                <Field label="Referring Contact" value={fmt(r.referring_contact)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Detailed Reasons</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Primary Reason" value={fmt(r.reason_for_referral)} fullWidth />
                                <Field label="Immediate Concern Identified" value={fmt(r.immediate_concern_identified)} fullWidth />
                                {r.reasons_for_referral && r.reasons_for_referral.length > 0 && (
                                  <div className="col-span-full">
                                    <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-1">Selected Categories</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {r.reasons_for_referral.map((cat, idx) => (
                                        <span key={idx} className="rounded-md bg-base-200 px-2 py-0.5 text-xs font-medium capitalize border border-base-300">
                                          {cat.replace("_", " ")}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {r.other_reason_details && <Field label="Other Reason Details" value={fmt(r.other_reason_details)} fullWidth />}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Referral Tracking</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Field label="Action Taken" value={r.action_taken ? r.action_taken.replace("_", " ") : "—"} />
                                  <Field label="Referred To" value={fmt(r.referred_to)} />
                                  <Field label="Date Referred" value={fmtDate(r.date_referred)} />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">MYS Officer Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Field label="Officer Name" value={fmt(r.mys_officer)} />
                                  <Field label="Officer Signature" value={fmt(r.officer_signature)} />
                                  <Field label="Signature Reference" value={fmt(r.signature_reference)} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR RECEIPTS =====
                    if (activeTab === "receipts") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <FileCheck className="size-4 text-primary" />
                                {r.referral_id || `Receipt #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Date Received: {fmtDate(r.date_received)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.disposition} fallback="Pending" />
                              <button
                                type="button"
                                onClick={() => setEditingReceipt(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Referral Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Referral ID" value={fmt(r.referral_id)} />
                                <Field label="Beneficiary ID" value={fmt(r.beneficiary_ID)} />
                                <Field label="Date Received" value={fmtDate(r.date_received)} />
                                <Field label="Referring Institution" value={fmt(r.referring_institution)} />
                                <Field label="Referring Officer" value={fmt(r.referring_officer)} />
                                <Field label="Reason for Referral" value={r.reason_for_referral ? r.reason_for_referral.replace("_", " ") : "—"} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Information Received</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Field label="Background Info" value={fmt(r.background_information_provided)} />
                                <Field label="Supporting Docs" value={fmt(r.supporting_documents_provided)} />
                                <Field label="Previous Service" value={fmt(r.previous_service_received)} />
                                <Field label="Prev. Facility" value={fmt(r.previous_institution_facility)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. MYS Disposition</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Disposition" value={r.disposition ? r.disposition.replace("_", " ") : "—"} />
                                <Field label="Disposition Date" value={fmtDate(r.disposition_date)} />
                                <Field label="Responsible Officer" value={fmt(r.responsible_mys_officer)} />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Reason for Disposition" value={fmt(r.reason_for_disposition)} fullWidth />
                                {r.other_disposition_details && <Field label="Other Disposition Details" value={fmt(r.other_disposition_details)} fullWidth />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR PRE-TREATMENT =====
                    if (activeTab === "preTreatment") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="size-4 text-primary" />
                                {r.preparation_id || `Preparation #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Admitted: {fmtDate(r.date_admitted)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status="in_progress" />
                              <button
                                type="button"
                                onClick={() => setEditingPreTreatment(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Facility Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Preparation ID" value={fmt(r.preparation_id)} />
                                <Field label="Facility" value={fmt(r.treatment_rehabilitation_facility)} />
                                <Field label="Date Admitted" value={fmtDate(r.date_admitted)} />
                                <Field label="MYS Officer" value={fmt(r.mys_officer)} />
                                <Field label="Preparation Date" value={fmtDate(r.preparation_date)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Planning & Coordination</h4>
                              <div className="space-y-6">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-2">Facility Communications</p>
                                  {renderList(r.facility_communications)}
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-2">Skills Opportunities</p>
                                  {renderList(r.skills_opportunities)}
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-2">Youth Development Programmes</p>
                                  {renderList(r.youth_development_programmes)}
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-2">Sports / Recreation Activities</p>
                                  {renderList(r.sports_recreation_activities)}
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-2">Family / Community Coordination</p>
                                  {renderList(r.family_community_coordination)}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Transition Preparation</h4>
                              <Field label="Proposed MYS Intervention" value={fmt(r.proposed_mys_intervention)} fullWidth />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR ARYEP =====
                    if (activeTab === "aryep") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <GraduationCap className="size-4 text-primary" />
                                {r.aryep_id || `ARYEP #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Registered: {fmtDate(r.registration_date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status="active" />
                              <button
                                type="button"
                                onClick={() => setEditingARYEP(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Registration & Referral</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Referral ID" value={fmt(r.referral_id)} />
                                <Field label="Referral Source" value={fmt(r.referral_source)} />
                                <Field label="Discharge Date" value={fmtDate(r.discharge_transition_date)} />
                                <Field label="Previous Facility" value={fmt(r.previous_treatment_facility)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. AR-YEP Programme</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Field label="Programme Site" value={fmt(r.programme_site)} />
                                <Field label="Assigned MYS Officer" value={fmt(r.assigned_mys_officer)} />
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-1">Intervention Pathways</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                      const pathways = normalizeArray(r.intervention_pathways);
                                      return pathways.length > 0 ? (
                                        pathways.map((pathway, idx) => (
                                          <span key={idx} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize border border-primary/20 text-primary">
                                            {pathway.replace("_", " ")}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-base-content/40">No pathways selected.</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {r.other_intervention_details && (
                                  <Field label="Other Details" value={fmt(r.other_intervention_details)} fullWidth />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR REINTEGRATION PLANS =====
                    if (activeTab === "plans") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <ClipboardList className="size-4 text-primary" />
                                {r.plan_reference_id || `Plan #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Date: {fmtDate(r.date_of_plan)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status="active" />
                              <button
                                type="button"
                                onClick={() => setEditingPlan(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Plan Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Plan Reference ID" value={fmt(r.plan_reference_id)} />
                                <Field label="Date of Plan" value={fmtDate(r.date_of_plan)} />
                                <Field label="MYS Officer / Case Manager" value={fmt(r.mys_officer_case_manager)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Identified Needs</h4>
                              {renderList(r.identified_needs)}
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Intervention Activities</h4>
                              {renderList(r.intervention_activities)}
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">D. Reintegration Goal</h4>
                              <div className="grid grid-cols-1 gap-4">
                                <Field label="Primary Goal" value={fmt(r.primary_goal)} fullWidth />
                                <Field label="Expected Outcome" value={fmt(r.expected_outcome)} fullWidth />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR TVET / SKILLS =====
                    if (activeTab === "tvet") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Briefcase className="size-4 text-primary" />
                                {r.tvet_reference_id || `TVET #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Trade: {fmt(r.trade)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.completed_training === "yes" ? "Completed" : "In Progress"} />
                              <button
                                type="button"
                                onClick={() => setEditingTVET(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Training Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Institution" value={fmt(r.training_institution)} />
                                <Field label="Training Level" value={fmt(r.training_level)} />
                                <Field label="Enrollment Date" value={fmtDate(r.enrollment_date)} />
                                <Field label="Expected Completion" value={fmtDate(r.expected_completion)} />
                                <Field label="Actual Completion" value={fmtDate(r.actual_completion)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Attendance & Progress</h4>
                              {renderList(r.attendance_progress)}
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Completion & Certification</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Completed?" value={fmt(r.completed_training)} />
                                {r.completed_training === "yes" && (
                                  <>
                                    <Field label="Certificate Obtained?" value={fmt(r.certification_obtained)} />
                                    {r.certification_obtained === "yes" && (
                                      <>
                                        <Field label="Certificate No." value={fmt(r.certificate_number)} />
                                        <Field label="Certificate Date" value={fmtDate(r.certificate_date)} />
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                              {r.completed_training === "no" && (
                                <div className="grid grid-cols-1 gap-3">
                                  <Field label="Reason for Non-Completion" value={fmt(r.reason_for_non_completion)} fullWidth />
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">D. Post-Training Outcome</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-1">Outcomes</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                      const outcomes = normalizeArray(r.post_training_outcome);
                                      return outcomes.length > 0 ? (
                                        outcomes.map((o, idx) => (
                                          <span key={idx} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize border border-primary/20 text-primary">
                                            {o.replace("_", " ")}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-base-content/40">None selected.</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {r.other_post_training_details && (
                                  <Field label="Other Outcome Details" value={fmt(r.other_post_training_details)} fullWidth />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR INTERVENTIONS =====
                    if (activeTab === "interventions") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <HeartHandshake className="size-4 text-primary" />
                                {r.intervention_reference_id || `Intervention #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                {r.intervention_type ? r.intervention_type.replace(/_/g, " ") : "Intervention"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.completion_status} fallback="Pending" />
                              <button
                                type="button"
                                onClick={() => setEditingIntervention(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Intervention Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Provider" value={fmt(r.provider)} />
                                <Field label="Location" value={fmt(r.location)} />
                                <Field label="Start Date" value={fmtDate(r.start_date)} />
                                <Field label="End Date" value={fmtDate(r.end_date)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Participation</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Total Sessions" value={fmt(r.number_of_sessions)} />
                                <Field label="Sessions Attended" value={fmt(r.sessions_attended)} />
                                <Field label="Certificate Issued?" value={fmt(r.certificate_issued)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Outcome Achieved</h4>
                              <Field label="Description" value={fmt(r.outcome_achieved)} fullWidth />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR EMPLOYMENT / APPRENTICESHIP / BUSINESS =====
                    if (activeTab === "employment") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Briefcase className="size-4 text-primary" />
                                {r.emp_record_reference_id || `Employment #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Status: {r.employment_status ? r.employment_status.replace(/_/g, " ") : "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.employment_status} fallback="Pending" />
                              <button
                                type="button"
                                onClick={() => setEditingEmployment(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Employment</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Employer" value={fmt(r.employer)} />
                                <Field label="Sector" value={fmt(r.employment_sector)} />
                                <Field label="Job Title" value={fmt(r.job_title)} />
                                <Field label="Start Date" value={fmtDate(r.employment_start_date)} />
                                <Field label="Type" value={r.employment_type ? r.employment_type.replace(/_/g, " ") : "—"} />
                                <Field label="Current Status" value={r.current_employment_status ? r.current_employment_status.replace(/_/g, " ") : "—"} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Apprenticeship</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Provider" value={fmt(r.apprenticeship_provider)} />
                                <Field label="Trade" value={fmt(r.apprenticeship_trade)} />
                                <Field label="Start Date" value={fmtDate(r.apprenticeship_start_date)} />
                                <Field label="Completion Date" value={fmtDate(r.apprenticeship_completion_date)} />
                                <Field label="Outcome" value={r.apprenticeship_outcome ? r.apprenticeship_outcome.replace(/_/g, " ") : "—"} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Business Support</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Business Type" value={fmt(r.business_type)} />
                                <Field label="Location" value={fmt(r.business_location)} />
                                <Field label="Startup Capital" value={fmt(r.startup_capital)} />
                                <Field label="Date Started" value={fmtDate(r.date_business_started)} />
                                <Field label="Current Status" value={r.business_current_status ? r.business_current_status.replace(/_/g, " ") : "—"} />
                                <Field label="Income Range" value={fmt(r.estimated_income_range)} />
                                <Field label="Persons Employed" value={fmt(r.number_of_persons_employed)} />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Startup Support Received" value={fmt(r.startup_support_received)} fullWidth />
                                <Field label="Equipment / Toolkit Received" value={fmt(r.equipment_toolkit_received)} fullWidth />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR FAMILY & COMMUNITY REINTEGRATION =====
                    if (activeTab === "familyReintegration") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <User className="size-4 text-primary" />
                                {r.reintegration_reference_id || `Family Reintegration #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Status: {r.family_reunification_status ? r.family_reunification_status.replace(/_/g, " ") : "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.family_reunification_status} fallback="Pending" />
                              <button
                                type="button"
                                onClick={() => setEditingFamily(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Family Reintegration</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Reunification Status" value={r.family_reunification_status ? r.family_reunification_status.replace("_", " ") : "—"} />
                                <Field label="Date Reunited" value={fmtDate(r.date_reunited)} />
                                <Field label="Family/Community Location" value={fmt(r.family_community_location)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Community Reintegration</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <Field label="Accepted by Family" value={fmt(r.accepted_by_family)} />
                                <Field label="Accepted by Community" value={fmt(r.accepted_by_community)} />
                                <Field label="Community Activities" value={fmt(r.participating_in_community_activities)} />
                                <Field label="Youth Org Member" value={fmt(r.member_of_youth_organization)} />
                                <Field label="Peer Support Member" value={fmt(r.member_of_peer_support_group)} />
                                <Field label="Community Service" value={fmt(r.participating_in_community_service)} />
                                <Field label="Leadership Activities" value={fmt(r.participating_in_leadership_activities)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Social Cohesion</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Activity Date" value={fmtDate(r.activity_date)} />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Social Cohesion Activity" value={fmt(r.social_cohesion_activity)} fullWidth />
                                <Field label="Conflict Resolution Activity" value={fmt(r.conflict_resolution_activity)} fullWidth />
                                <Field label="Outcome" value={fmt(r.outcome)} fullWidth />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR FOLLOW-UPS =====
                    if (activeTab === "followUps") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="size-4 text-primary" />
                                {r.follow_up_reference_id || `Follow-Up #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">Date: {fmtDate(r.follow_up_date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.reintegration_progressing} fallback="Pending" />
                              <button
                                type="button"
                                onClick={() => setEditingFollowUp(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Follow-Up Info</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Period" value={r.follow_up_period ? r.follow_up_period.replace("_", " ") : "—"} />
                                <Field label="Other Period" value={fmt(r.other_follow_up_period)} />
                                <Field label="Officer" value={fmt(r.follow_up_officer)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Current Status</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Field label="Employment" value={r.employment_status ? r.employment_status.replace(/_/g, " ") : "—"} />
                                <Field label="Business" value={r.business_status ? r.business_status.replace(/_/g, " ") : "—"} />
                                <Field label="Education" value={r.education_status ? r.education_status.replace(/_/g, " ") : "—"} />
                                <Field label="Family Situation" value={r.family_situation_status ? r.family_situation_status.replace(/_/g, " ") : "—"} />
                                <Field label="Community Participation" value={r.community_participation_status ? r.community_participation_status.replace(/_/g, " ") : "—"} />
                                <Field label="Peer Support" value={r.peer_support_status ? r.peer_support_status.replace(/_/g, " ") : "—"} />
                                <Field label="Mentorship" value={r.mentorship_status ? r.mentorship_status.replace(/_/g, " ") : "—"} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Findings & Outcomes</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Reintegration Progressing?" value={fmt(r.reintegration_progressing)} />
                                <Field label="Additional Support Required?" value={fmt(r.additional_support_required)} />
                                <Field label="Referral Required?" value={fmt(r.referral_required)} />
                                {r.referral_required === "yes" && (
                                  <>
                                    <Field label="Referral Made To" value={fmt(r.referral_made_to)} />
                                    <Field label="Referral Date" value={fmtDate(r.referral_date)} />
                                  </>
                                )}
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Outcome / Remarks" value={fmt(r.outcome)} fullWidth />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR CASE CLOSURES =====
                    if (activeTab === "caseClosures") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <FileCheck className="size-4 text-primary" />
                                {r.closure_reference_id || `Closure #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                Closed: {fmtDate(r.date_of_closure)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={r.final_outcome} fallback="Closed" />
                              <button
                                type="button"
                                onClick={() => setEditingCaseClosure(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Case Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Reference ID" value={fmt(r.closure_reference_id)} />
                                <Field label="ARYEP Reg No." value={fmt(r.aryep_registration_number)} />
                                <Field label="Date Enrolled" value={fmtDate(r.date_enrolled)} />
                                <Field label="Date of Closure" value={fmtDate(r.date_of_closure)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Final Outcome</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Final Outcome" value={r.final_outcome ? r.final_outcome.replace(/_/g, " ") : "—"} />
                                {r.other_final_outcome && (
                                  <Field label="Other Outcome Details" value={fmt(r.other_final_outcome)} />
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Final Assessment</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Overall Reintegration Status" value={r.overall_reintegration_status ? r.overall_reintegration_status.replace(/_/g, " ") : "—"} />
                                <Field label="Further Follow-Up Required?" value={fmt(r.further_follow_up_required)} />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <Field label="Reason for Closure" value={fmt(r.reason_for_closure)} fullWidth />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">D. Responsible Officers</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="MYS Officer" value={fmt(r.mys_officer)} />
                                <Field label="Supervisor" value={fmt(r.supervisor)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== FULL DETAIL CARD FOR SERVICE PROVIDERS =====
                    if (activeTab === "serviceProviders") {
                      return (
                        <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <div className="bg-base-200/40 px-4 py-3 border-b border-base-300 flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Briefcase className="size-4 text-primary" />
                                {r.organization_name || `Provider #${r.id}`}
                              </h3>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                ID: {r.provider_id} | Type: {r.organization_type ? r.organization_type.replace(/_/g, " ") : "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingServiceProvider(r)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                              >
                                <Edit className="size-3.5" /> Edit
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">A. Provider Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Organization Type" value={r.organization_type ? r.organization_type.replace(/_/g, " ") : "—"} />
                                {r.other_organization_type && <Field label="Other Type Details" value={fmt(r.other_organization_type)} />}
                                <Field label="County" value={fmt(r.county)} />
                                <Field label="District" value={fmt(r.district)} />
                                <Field label="Community" value={fmt(r.community)} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">B. Services</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Target Population" value={r.target_population ? r.target_population.replace(/_/g, " ") : "—"} />
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-base-content/50 mb-1">Service Categories</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                      const cats = normalizeArray(r.service_categories);
                                      return cats.length > 0 ? (
                                        cats.map((c, idx) => (
                                          <span key={idx} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize border border-primary/20 text-primary">
                                            {c.replace(/_/g, " ")}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-base-content/40">None selected.</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <Field label="Services Offered" value={fmt(r.services_offered)} fullWidth />
                                {r.other_service_category && <Field label="Other Category Details" value={fmt(r.other_service_category)} fullWidth />}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">C. Contact & Verification</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Field label="Contact Person" value={fmt(r.contact_person)} />
                                <Field label="Telephone" value={fmt(r.telephone)} />
                                <Field label="Email" value={fmt(r.email)} />
                                <Field label="Referral Services Available?" value={fmt(r.referral_services_available)} />
                                <Field label="Last Verified" value={fmtDate(r.date_last_verified)} />
                              </div>
                              {r.accreditation_authorization && (
                                <div className="grid grid-cols-1 gap-3">
                                  <Field label="Accreditation Details" value={fmt(r.accreditation_authorization)} fullWidth />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ===== GENERIC CARD FOR OTHER TABS =====
                    return (
                      <div key={r.id} className="p-4 rounded-lg border border-base-300 bg-base-100 flex justify-between items-center shadow-sm hover:border-primary/40 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{r.organization_name || r.trade || r.intervention_type || r.disposition || r.preparation_id || r.plan_reference_id || r.tvet_reference_id || r.intervention_reference_id || r.emp_record_reference_id || r.follow_up_reference_id || r.closure_reference_id || r.aryep_id || `Record #${r.id}`}</p>
                          <p className="text-xs text-base-content/60">{fmtDate(r.date_received || r.date_admitted || r.registration_date || r.date_of_plan || r.enrollment_date || r.start_date || r.date_enrolled || r.follow_up_date || r.date_of_closure || r.created_at)}</p>
                        </div>
                        <button className="text-primary text-xs font-medium hover:underline">View Details</button>
                      </div>
                    );
                  })}
                </div>
              ) : (

                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-base-300 bg-base-200/30 p-6 text-center">
                  <ActiveIcon className="size-10 text-base-content/20 mb-3" />
                  <h3 className="text-sm font-medium text-base-content">No {TABS.find(t => t.id === activeTab)?.label} found</h3>
                  <p className="text-xs text-base-content/60 mt-1 mb-4">
                    This beneficiary does not have any {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} recorded yet.
                  </p>

                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
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

      {/* ===== ADD RECORD MODAL ===== */}
      <FormModal
        title={`New ${TABS.find(t => t.id === activeTab)?.label}`}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
      >
        {activeTab === "referrals" && (
          <MYSReferralForm
            initial={{ person_id: person.person_id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "receipts" && (
          <MYSReceiptForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "preTreatment" && (
          <MYSPreTreatmentForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "aryep" && (
          <MYSARYEPForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "plans" && (
          <MYSReintegrationPlanForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "tvet" && (
          <MYSTVETForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "interventions" && (
          <MYSInterventionForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "employment" && (
          <MYSEmploymentForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "familyReintegration" && (
          <MYSFamilyReintegrationForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "followUps" && (
          <MYSFollowUpForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "caseClosures" && (
          <MYSCaseClosureForm
            initial={{ person_id: person.id }}
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab === "serviceProviders" && (
          <MYSServiceProviderForm
            onSaved={() => {
              setFormOpen(false);
              fetchRecords();
            }}
            onCancel={() => setFormOpen(false)}
          />
        )}
        {activeTab !== "referrals" && activeTab !== "receipts" && activeTab !== "preTreatment" && activeTab !== "aryep" && activeTab !== "plans" && activeTab !== "tvet" && activeTab !== "interventions" && activeTab !== "employment" && activeTab !== "familyReintegration" && activeTab !== "followUps" && activeTab !== "caseClosures" && activeTab !== "serviceProviders" && activeTab !== "overview" && (
          <div className="p-8 text-center text-base-content/50">
            Form for {TABS.find(t => t.id === activeTab)?.label} not built yet.
          </div>
        )}
      </FormModal>

      {/* ===== EDIT REFERRAL MODAL ===== */}
      <FormModal
        title="Edit Referral"
        isOpen={!!editingReferral}
        onClose={() => setEditingReferral(null)}
      >
        {editingReferral && (
          <MYSReferralForm
            initial={{ ...editingReferral, person_id: editingReferral.person_id || person.person_id }}
            onSaved={() => {
              setEditingReferral(null);
              fetchRecords();
            }}
            onCancel={() => setEditingReferral(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT RECEIPT MODAL ===== */}
      <FormModal
        title="Edit Receipt & Disposition"
        isOpen={!!editingReceipt}
        onClose={() => setEditingReceipt(null)}
      >
        {editingReceipt && (
          <MYSReceiptForm
            initial={{ ...editingReceipt, person_id: editingReceipt.person_id || person.id }}
            onSaved={() => {
              setEditingReceipt(null);
              fetchRecords();
            }}
            onCancel={() => setEditingReceipt(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT PRE-TREATMENT MODAL ===== */}
      <FormModal
        title="Edit Pre-Treatment / Reintegration"
        isOpen={!!editingPreTreatment}
        onClose={() => setEditingPreTreatment(null)}
      >
        {editingPreTreatment && (
          <MYSPreTreatmentForm
            initial={{ ...editingPreTreatment, person_id: editingPreTreatment.person_id || person.id }}
            onSaved={() => {
              setEditingPreTreatment(null);
              fetchRecords();
            }}
            onCancel={() => setEditingPreTreatment(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT ARYEP MODAL ===== */}
      <FormModal
        title="Edit ARYEP Registration"
        isOpen={!!editingARYEP}
        onClose={() => setEditingARYEP(null)}
      >
        {editingARYEP && (
          <MYSARYEPForm
            initial={{ ...editingARYEP, person_id: editingARYEP.person_id || person.id }}
            onSaved={() => {
              setEditingARYEP(null);
              fetchRecords();
            }}
            onCancel={() => setEditingARYEP(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT REINTEGRATION PLAN MODAL ===== */}
      <FormModal
        title="Edit Reintegration Plan"
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
      >
        {editingPlan && (
          <MYSReintegrationPlanForm
            initial={{ ...editingPlan, person_id: editingPlan.person_id || person.id }}
            onSaved={() => {
              setEditingPlan(null);
              fetchRecords();
            }}
            onCancel={() => setEditingPlan(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT TVET MODAL ===== */}
      <FormModal
        title="Edit TVET / Skills Record"
        isOpen={!!editingTVET}
        onClose={() => setEditingTVET(null)}
      >
        {editingTVET && (
          <MYSTVETForm
            initial={{ ...editingTVET, person_id: editingTVET.person_id || person.id }}
            onSaved={() => {
              setEditingTVET(null);
              fetchRecords();
            }}
            onCancel={() => setEditingTVET(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT INTERVENTION MODAL ===== */}
      <FormModal
        title="Edit Youth Intervention"
        isOpen={!!editingIntervention}
        onClose={() => setEditingIntervention(null)}
      >
        {editingIntervention && (
          <MYSInterventionForm
            initial={{ ...editingIntervention, person_id: editingIntervention.person_id || person.id }}
            onSaved={() => {
              setEditingIntervention(null);
              fetchRecords();
            }}
            onCancel={() => setEditingIntervention(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT EMPLOYMENT MODAL ===== */}
      <FormModal
        title="Edit Employment / Business Record"
        isOpen={!!editingEmployment}
        onClose={() => setEditingEmployment(null)}
      >
        {editingEmployment && (
          <MYSEmploymentForm
            initial={{ ...editingEmployment, person_id: editingEmployment.person_id || person.id }}
            onSaved={() => {
              setEditingEmployment(null);
              fetchRecords();
            }}
            onCancel={() => setEditingEmployment(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT FAMILY REINTEGRATION MODAL ===== */}
      <FormModal
        title="Edit Family & Community Reintegration"
        isOpen={!!editingFamily}
        onClose={() => setEditingFamily(null)}
      >
        {editingFamily && (
          <MYSFamilyReintegrationForm
            initial={{ ...editingFamily, person_id: editingFamily.person_id || person.id }}
            onSaved={() => {
              setEditingFamily(null);
              fetchRecords();
            }}
            onCancel={() => setEditingFamily(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT FOLLOW-UP MODAL ===== */}
      <FormModal
        title="Edit Follow-Up Record"
        isOpen={!!editingFollowUp}
        onClose={() => setEditingFollowUp(null)}
      >
        {editingFollowUp && (
          <MYSFollowUpForm
            initial={{ ...editingFollowUp, person_id: editingFollowUp.person_id || person.id }}
            onSaved={() => {
              setEditingFollowUp(null);
              fetchRecords();
            }}
            onCancel={() => setEditingFollowUp(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT CASE CLOSURE MODAL ===== */}
      <FormModal
        title="Edit Case Closure"
        isOpen={!!editingCaseClosure}
        onClose={() => setEditingCaseClosure(null)}
      >
        {editingCaseClosure && (
          <MYSCaseClosureForm
            initial={{ ...editingCaseClosure, person_id: editingCaseClosure.person_id || person.id }}
            onSaved={() => {
              setEditingCaseClosure(null);
              fetchRecords();
            }}
            onCancel={() => setEditingCaseClosure(null)}
          />
        )}
      </FormModal>

      {/* ===== EDIT SERVICE PROVIDER MODAL ===== */}
      <FormModal
        title="Edit Service Provider"
        isOpen={!!editingServiceProvider}
        onClose={() => setEditingServiceProvider(null)}
      >
        {editingServiceProvider && (
          <MYSServiceProviderForm
            initial={editingServiceProvider}
            onSaved={() => {
              setEditingServiceProvider(null);
              fetchRecords();
            }}
            onCancel={() => setEditingServiceProvider(null)}
          />
        )}
      </FormModal>

      {/* ===== PROFILE EDIT NOTICE ===== */}
      <FormModal
        title="Edit Beneficiary"
        isOpen={showProfileEditInfo}
        onClose={() => setShowProfileEditInfo(false)}
      >
        <div className="space-y-4 p-2">
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-base-content/80">
            <AlertCircle className="size-5 shrink-0 text-warning mt-0.5" />
            <div>
              <p className="font-medium">Editing is not available from this view</p>
              <p className="text-xs text-base-content/60 mt-1">
                Beneficiary records are read-only here. To make changes, update the record in its source system — the MOYS dashboard will pick up the update on next refresh.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-base-300 bg-base-200/40 p-3 text-xs text-base-content/70">
            <p className="font-semibold uppercase tracking-wider text-[10px] mb-2">Current Record</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><span className="text-base-content/50">Name:</span> {[person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ") || "—"}</div>
              <div><span className="text-base-content/50">ID:</span> {person.id ?? "—"}</div>
              <div><span className="text-base-content/50">Phone:</span> {fmt(person.phone_number)}</div>
              <div><span className="text-base-content/50">Email:</span> {fmt(person.email)}</div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowProfileEditInfo(false)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110"
            >
              Close
            </button>
          </div>
        </div>
      </FormModal>

    </div>
  );
}