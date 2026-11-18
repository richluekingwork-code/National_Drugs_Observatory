// frontend/src/components/moys/MYSPreTreatmentForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";
import JSONListInput from "./JSONListInput";

const Input = ({ label, type = "text", value, onChange, required }) => (
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
    />
  </label>
);

const Textarea = ({ label, value, onChange, rows = 3, required }) => (
  <label className="block col-span-1 md:col-span-3">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <textarea
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      rows={rows}
      value={value || ""}
      onChange={onChange}
      required={required}
    />
  </label>
);

// Helper to ensure incoming array data is stringified safely
const toJsonString = (val) => {
  if (!val) return "[]";
  if (typeof val === "string") {
    try {
      JSON.parse(val);
      return val; // already a valid JSON string
    } catch {
      return "[]";
    }
  }
  return JSON.stringify(val);
};

// Exact field structures based on your Django model help_text
const COMMS_FIELDS = ["date", "facility_officer_contacted", "purpose", "outcome"];
const SKILLS_FIELDS = ["opportunity", "institution_provider", "suitability", "status"];
const YOUTH_FIELDS = ["programme", "provider", "proposed_participation", "status"];
const SPORTS_FIELDS = ["activity", "provider_location", "proposed_date", "status"];
const FAMILY_FIELDS = ["date", "person_structure", "purpose", "outcome"];

export default function MYSPreTreatmentForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    preparation_id: initial?.preparation_id || "",
    treatment_rehabilitation_facility: initial?.treatment_rehabilitation_facility || "",
    date_admitted: initial?.date_admitted || new Date().toISOString().split("T")[0],
    mys_officer: initial?.mys_officer || "",
    preparation_date: initial?.preparation_date || new Date().toISOString().split("T")[0],
    proposed_mys_intervention: initial?.proposed_mys_intervention || "",
    
    // JSON Arrays converted to strings
    facility_communications: toJsonString(initial?.facility_communications),
    skills_opportunities: toJsonString(initial?.skills_opportunities),
    youth_development_programmes: toJsonString(initial?.youth_development_programmes),
    sports_recreation_activities: toJsonString(initial?.sports_recreation_activities),
    family_community_coordination: toJsonString(initial?.family_community_coordination),
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });

      if (!isEditing && initial?.person_id) {
        fd.append("beneficiary_id", initial.person_id);
      }

      if (isEditing) {
        await moysService.preTreatment.update(initial.id, fd);
      } else {
        await moysService.preTreatment.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Beneficiary & Facility */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Beneficiary & Facility</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Preparation ID" value={form.preparation_id} onChange={(e) => set("preparation_id", e.target.value)} required />
          <Input label="Treatment Facility" value={form.treatment_rehabilitation_facility} onChange={(e) => set("treatment_rehabilitation_facility", e.target.value)} required />
          <Input label="Date Admitted" type="date" value={form.date_admitted} onChange={(e) => set("date_admitted", e.target.value)} required />
          <Input label="MYS Officer" value={form.mys_officer} onChange={(e) => set("mys_officer", e.target.value)} required />
          <Input label="Preparation Date" type="date" value={form.preparation_date} onChange={(e) => set("preparation_date", e.target.value)} required />
        </div>
      </section>

      {/* B. Planning & Coordination (Dynamic Arrays) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Planning & Coordination</h3>
        <div className="grid grid-cols-1 gap-4">
          <JSONListInput 
            label="Facility Communications" 
            value={form.facility_communications} 
            onChange={(v) => set("facility_communications", v)} 
            fields={COMMS_FIELDS} 
          />
          <JSONListInput 
            label="Skills Opportunities" 
            value={form.skills_opportunities} 
            onChange={(v) => set("skills_opportunities", v)} 
            fields={SKILLS_FIELDS} 
          />
          <JSONListInput 
            label="Youth Development Programmes" 
            value={form.youth_development_programmes} 
            onChange={(v) => set("youth_development_programmes", v)} 
            fields={YOUTH_FIELDS} 
          />
          <JSONListInput 
            label="Sports / Recreation Activities" 
            value={form.sports_recreation_activities} 
            onChange={(v) => set("sports_recreation_activities", v)} 
            fields={SPORTS_FIELDS} 
          />
          <JSONListInput 
            label="Family / Community Coordination" 
            value={form.family_community_coordination} 
            onChange={(v) => set("family_community_coordination", v)} 
            fields={FAMILY_FIELDS} 
          />
        </div>
      </section>

      {/* C. Transition Preparation */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Transition Preparation</h3>
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Proposed MYS Intervention" value={form.proposed_mys_intervention} onChange={(e) => set("proposed_mys_intervention", e.target.value)} required rows={3} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Preparation"}
        </button>
      </div>
    </form>
  );
}