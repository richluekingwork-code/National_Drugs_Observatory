// frontend/src/components/mog/AssessmentForm.jsx
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { mogService } from "../../services/mogService";
import { useAuth } from "../../contexts/AuthContext";

const PARENT_STATUS = [
  { value: "living", label: "Living" },
  { value: "deceased", label: "Deceased" },
  { value: "missing", label: "Missing" },
  { value: "unknown", label: "Unknown" },
];

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const CARE_ARRANGEMENTS = [
  { value: "orphanage", label: "Orphanage" },
  { value: "adoption_agency", label: "Adoption Agency / Transit Home" },
  { value: "safe_home", label: "Safe Home" },
  { value: "specialized_home", label: "Specialized Home" },
  { value: "kinship", label: "Kinship Care" },
  { value: "foster", label: "Foster Care" },
  { value: "other", label: "Other" },
];

const COUNTIES = [
  { value: "bomi", label: "Bomi" },
  { value: "bong", label: "Bong" },
  { value: "gbarpolu", label: "Gbarpolu" },
  { value: "grand_bassa", label: "Grand Bassa" },
  { value: "grand_cape_mount", label: "Grand Cape Mount" },
  { value: "grand_gedeh", label: "Grand Gedeh" },
  { value: "grand_kru", label: "Grand Kru" },
  { value: "lofa", label: "Lofa" },
  { value: "margibi", label: "Margibi" },
  { value: "maryland", label: "Maryland" },
  { value: "montserrado", label: "Montserrado" },
  { value: "nimba", label: "Nimba" },
  { value: "river_cess", label: "River Cess" },
  { value: "river_gee", label: "River Gee" },
  { value: "sinoe", label: "Sinoe" },
];

const Input = ({ label, type = "text", value, onChange, required, placeholder }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <input
      type={type}
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      value={value || ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
    />
  </label>
);

const Select = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">{label}</span>
    <select
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none bg-base-100"
      value={value || ""}
      onChange={onChange}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange, rows = 2 }) => (
  <label className="block col-span-1 md:col-span-2">
    <span className="text-xs font-medium text-base-content/70">{label}</span>
    <textarea
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      rows={rows}
      value={value || ""}
      onChange={onChange}
    />
  </label>
);

export default function AssessmentForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth(); // <-- ADDED

  // --- Filter Counties based on User Scope ---
  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTIES;
    
    // Convert backend counties (e.g., "Bong") to lowercase for comparison
    const normalizedAssigned = assigned.map(c => typeof c === 'string' ? c.toLowerCase() : c);
    
    return COUNTIES.filter((c) => normalizedAssigned.includes(c.value.toLowerCase()));
  }, [currentMembership]);

  const [form, setForm] = useState({
    person_id: initial?.person_id || "",
    case_meets_eligibility: initial?.case_meets_eligibility || false,
    consent_assent_completed: initial?.consent_assent_completed || false,
    child_adult_code: initial?.child_adult_code || "",
    registration_date: initial?.registration_date || new Date().toISOString().split("T")[0],
    county: initial?.county || "",
    languages_spoken: initial?.languages_spoken || "",
    special_communication_needs: initial?.special_communication_needs || "",
    father_name: initial?.father_name || "",
    father_date_of_birth: initial?.father_date_of_birth || "",
    father_nationality: initial?.father_nationality || "",
    father_county_origin: initial?.father_county_origin || "",
    father_district_origin: initial?.father_district_origin || "",
    father_status: initial?.father_status || "",
    father_address: initial?.father_address || "",
    father_contact: initial?.father_contact || "",
    mother_name: initial?.mother_name || "",
    mother_date_of_birth: initial?.mother_date_of_birth || "",
    mother_nationality: initial?.mother_nationality || "",
    mother_county_origin: initial?.mother_county_origin || "",
    mother_district_origin: initial?.mother_district_origin || "",
    mother_status: initial?.mother_status || "",
    mother_address: initial?.mother_address || "",
    mother_contact: initial?.mother_contact || "",
    care_arrangement: initial?.care_arrangement || "",
    care_full_names: initial?.care_full_names || "",
    care_date_birth: initial?.care_date_birth || "",
    care_nationality: initial?.care_nationality || "",
    care_town_of_origin: initial?.care_town_of_origin || "",
    care_gender: initial?.care_gender || "",
    care_current_address: initial?.care_current_address || "",
    care_contact_number: initial?.care_contact_number || "",
    protection_concerns: initial?.protection_concerns || "",
    physical_disability: initial?.physical_disability || "",
    mental_illness: initial?.mental_illness || "",
    substances_abuse: initial?.substances_abuse || "",
    risk_level: initial?.risk_level || "",
    risk_summary: initial?.risk_summary || "",
    immediate_concern: initial?.immediate_concern || "",
    immediate_reason: initial?.immediate_reason || "",
    immediate_action_taken: initial?.immediate_action_taken || "",
    case_history: initial?.case_history || "",
    recommended_next_steps: initial?.recommended_next_steps || "",
    first_documented: initial?.first_documented || "",
    location_status: initial?.location_status || "",
    next_up_date: initial?.next_up_date ? initial.next_up_date.split("T")[0] : "",
    reporting_agency: initial?.reporting_agency || "",
    professional_name: initial?.professional_name || "",
    professional_cell: initial?.professional_cell || "",
    supervisor_name: initial?.supervisor_name || "",
    supervisor_cell: initial?.supervisor_cell || "",
    social_worker_signature: initial?.social_worker_signature || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent_assent_completed) {
      setErr("Consent or assent must be completed before saving.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form };
      const dateFields = ["father_date_of_birth", "mother_date_of_birth", "care_date_birth", "next_up_date"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (isEditing) {
        await mogService.assessments.update(initial.id, payload);
      } else {
        await mogService.assessments.create(payload);
      }
      onSaved();
    } catch (ex) {
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data)[0]?.map(String).join(": ")
        : ex.message;
      setErr(msg || "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* ================= BASIC INFO ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Basic Info & Eligibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Case / Child Code" value={form.child_adult_code} onChange={(e) => set("child_adult_code", e.target.value)} />
          <Input label="Registration Date" type="date" value={form.registration_date} onChange={(e) => set("registration_date", e.target.value)} />
          
          {/* CHANGED: Uses allowedCounties instead of COUNTIES */}
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={allowedCounties} />
          
          <Input label="Reporting Agency" value={form.reporting_agency} onChange={(e) => set("reporting_agency", e.target.value)} />
          <Textarea label="Languages Spoken" value={form.languages_spoken} onChange={(e) => set("languages_spoken", e.target.value)} />
          <Textarea label="Special Communication Needs" value={form.special_communication_needs} onChange={(e) => set("special_communication_needs", e.target.value)} />
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.case_meets_eligibility} onChange={(e) => set("case_meets_eligibility", e.target.checked)} />
            Case meets eligibility
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.consent_assent_completed} onChange={(e) => set("consent_assent_completed", e.target.checked)} />
            Consent / assent completed <span className="text-error">*</span>
          </label>
        </div>
      </section>

      {/* ================= FATHER DETAILS ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Father's Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          <Input label="Date of Birth" type="date" value={form.father_date_of_birth} onChange={(e) => set("father_date_of_birth", e.target.value)} />
          <Input label="Nationality" value={form.father_nationality} onChange={(e) => set("father_nationality", e.target.value)} />
          <Select label="Status" value={form.father_status} onChange={(e) => set("father_status", e.target.value)} options={PARENT_STATUS} />
          <Select label="County of Origin" value={form.father_county_origin} onChange={(e) => set("father_county_origin", e.target.value)} options={COUNTIES} />
          <Input label="District of Origin" value={form.father_district_origin} onChange={(e) => set("father_district_origin", e.target.value)} />
          <Input label="Contact" value={form.father_contact} onChange={(e) => set("father_contact", e.target.value)} />
          <Textarea label="Address" value={form.father_address} onChange={(e) => set("father_address", e.target.value)} />
        </div>
      </section>

      {/* ================= MOTHER DETAILS ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Mother's Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.mother_name} onChange={(e) => set("mother_name", e.target.value)} />
          <Input label="Date of Birth" type="date" value={form.mother_date_of_birth} onChange={(e) => set("mother_date_of_birth", e.target.value)} />
          <Input label="Nationality" value={form.mother_nationality} onChange={(e) => set("mother_nationality", e.target.value)} />
          <Select label="Status" value={form.mother_status} onChange={(e) => set("mother_status", e.target.value)} options={PARENT_STATUS} />
          <Select label="County of Origin" value={form.mother_county_origin} onChange={(e) => set("mother_county_origin", e.target.value)} options={COUNTIES} />
          <Input label="District of Origin" value={form.mother_district_origin} onChange={(e) => set("mother_district_origin", e.target.value)} />
          <Input label="Contact" value={form.mother_contact} onChange={(e) => set("mother_contact", e.target.value)} />
          <Textarea label="Address" value={form.mother_address} onChange={(e) => set("mother_address", e.target.value)} />
        </div>
      </section>

      {/* ================= CARE ARRANGEMENT ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Care Arrangement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Arrangement Type" value={form.care_arrangement} onChange={(e) => set("care_arrangement", e.target.value)} options={CARE_ARRANGEMENTS} />
          <Input label="Caregiver Full Name" value={form.care_full_names} onChange={(e) => set("care_full_names", e.target.value)} />
          <Input label="Caregiver DOB" type="date" value={form.care_date_birth} onChange={(e) => set("care_date_birth", e.target.value)} />
          <Input label="Caregiver Nationality" value={form.care_nationality} onChange={(e) => set("care_nationality", e.target.value)} />
          <Input label="Caregiver Gender" value={form.care_gender} onChange={(e) => set("care_gender", e.target.value)} />
          <Input label="Caregiver Town of Origin" value={form.care_town_of_origin} onChange={(e) => set("care_town_of_origin", e.target.value)} />
          <Input label="Caregiver Contact Number" value={form.care_contact_number} onChange={(e) => set("care_contact_number", e.target.value)} />
          <Textarea label="Caregiver Current Address" value={form.care_current_address} onChange={(e) => set("care_current_address", e.target.value)} />
        </div>
      </section>

      {/* ================= PROTECTION & RISK ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Protection & Risk</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Risk Level" value={form.risk_level} onChange={(e) => set("risk_level", e.target.value)} options={RISK_LEVELS} />
          <Textarea label="Risk Summary" value={form.risk_summary} onChange={(e) => set("risk_summary", e.target.value)} />
          <Textarea label="Protection Concerns" value={form.protection_concerns} onChange={(e) => set("protection_concerns", e.target.value)} />
          <Textarea label="Physical Disability" value={form.physical_disability} onChange={(e) => set("physical_disability", e.target.value)} />
          <Textarea label="Mental Illness" value={form.mental_illness} onChange={(e) => set("mental_illness", e.target.value)} />
          <Textarea label="Substances Abuse" value={form.substances_abuse} onChange={(e) => set("substances_abuse", e.target.value)} />
        </div>
      </section>

      {/* ================= IMMEDIATE & HISTORY ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Immediate Concerns & Case History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Immediate Concern" value={form.immediate_concern} onChange={(e) => set("immediate_concern", e.target.value)} />
          <Input label="First Documented" value={form.first_documented} onChange={(e) => set("first_documented", e.target.value)} />
          <Textarea label="Immediate Reason" value={form.immediate_reason} onChange={(e) => set("immediate_reason", e.target.value)} />
          <Textarea label="Immediate Action Taken" value={form.immediate_action_taken} onChange={(e) => set("immediate_action_taken", e.target.value)} />
          <Textarea label="Case History" value={form.case_history} onChange={(e) => set("case_history", e.target.value)} />
          <Textarea label="Recommended Next Steps" value={form.recommended_next_steps} onChange={(e) => set("recommended_next_steps", e.target.value)} />
          <Textarea label="Location Status" value={form.location_status} onChange={(e) => set("location_status", e.target.value)} />
          <Input label="Next Up Date" type="date" value={form.next_up_date} onChange={(e) => set("next_up_date", e.target.value)} />
        </div>
      </section>

      {/* ================= STAFF ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Staff Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Professional Name" value={form.professional_name} onChange={(e) => set("professional_name", e.target.value)} />
          <Input label="Professional Cell" value={form.professional_cell} onChange={(e) => set("professional_cell", e.target.value)} />
          <Input label="Supervisor Name" value={form.supervisor_name} onChange={(e) => set("supervisor_name", e.target.value)} />
          <Input label="Supervisor Cell" value={form.supervisor_cell} onChange={(e) => set("supervisor_cell", e.target.value)} />
          <Input label="Social Worker Signature" value={form.social_worker_signature} onChange={(e) => set("social_worker_signature", e.target.value)} />
        </div>
      </section>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Assessment"}
        </button>
      </div>
    </form>
  );
}