// frontend/src/components/moys/MYSARYEPForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const INTERVENTION_PATHWAY_CHOICES = [
  { value: "tvet", label: "TVET" },
  { value: "life_skills", label: "Life Skills" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "employment", label: "Employment" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "sports", label: "Sports" },
  { value: "leadership", label: "Leadership" },
  { value: "civic_engagement", label: "Civic Engagement" },
  { value: "digital_skills", label: "Digital Skills" },
  { value: "financial_literacy", label: "Financial Literacy" },
  { value: "other", label: "Other" },
];

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

export default function MYSARYEPForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  // Safely parse arrays
  const normalizeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const p = JSON.parse(val);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [form, setForm] = useState({
    aryep_id: initial?.aryep_id || "",
    registration_date: initial?.registration_date || new Date().toISOString().split("T")[0],
    referral_id: initial?.referral_id || "",
    referral_source: initial?.referral_source || "",
    previous_treatment_facility: initial?.previous_treatment_facility || "",
    discharge_transition_date: initial?.discharge_transition_date || "",
    programme_site: initial?.programme_site || "",
    intervention_pathways: normalizeArray(initial?.intervention_pathways),
    other_intervention_details: initial?.other_intervention_details || "",
    assigned_mys_officer: initial?.assigned_mys_officer || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePathway = (val) => {
    setForm((f) => {
      const pathways = f.intervention_pathways.includes(val)
        ? f.intervention_pathways.filter((p) => p !== val)
        : [...f.intervention_pathways, val];
      return { ...f, intervention_pathways: pathways };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      
      Object.keys(form).forEach((key) => {
        if (key === "intervention_pathways") return; // Handle separately
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });

      // Send array as JSON string
      fd.append("intervention_pathways", JSON.stringify(form.intervention_pathways));

      if (!isEditing && initial?.person_id) {
        fd.append("beneficiary_id", initial.person_id);
      }

      if (isEditing) {
        await moysService.aryep.update(initial.id, fd);
      } else {
        await moysService.aryep.create(fd);
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
      
      {/* A. Registration & Referral */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Registration Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="AR-YEP Beneficiary ID" value={form.aryep_id} onChange={(e) => set("aryep_id", e.target.value)} required />
          <Input label="Registration Date" type="date" value={form.registration_date} onChange={(e) => set("registration_date", e.target.value)} required />
          <Input label="Referral Source" value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} required />
          <Input label="Referral ID (Optional)" value={form.referral_id} onChange={(e) => set("referral_id", e.target.value)} />
          <Input label="Previous Treatment Facility" value={form.previous_treatment_facility} onChange={(e) => set("previous_treatment_facility", e.target.value)} />
          <Input label="Discharge/Transition Date" type="date" value={form.discharge_transition_date} onChange={(e) => set("discharge_transition_date", e.target.value)} />
        </div>
      </section>

      {/* B. Programme & Pathways */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. AR-YEP Programme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Programme Site" value={form.programme_site} onChange={(e) => set("programme_site", e.target.value)} required />
          <Input label="Assigned MYS Officer" value={form.assigned_mys_officer} onChange={(e) => set("assigned_mys_officer", e.target.value)} required />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-base-content/70 mb-2">Select Intervention Pathways:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-base-200/50 p-4 rounded-lg border border-base-300">
            {INTERVENTION_PATHWAY_CHOICES.map((pathway) => (
              <label key={pathway.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={form.intervention_pathways.includes(pathway.value)}
                  onChange={() => togglePathway(pathway.value)}
                />
                {pathway.label}
              </label>
            ))}
          </div>
        </div>

        {form.intervention_pathways.includes("other") && (
          <div className="mt-4">
            <Input
              label="Other Intervention Details"
              value={form.other_intervention_details}
              onChange={(e) => set("other_intervention_details", e.target.value)}
              required
            />
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Registration"}
        </button>
      </div>
    </form>
  );
}