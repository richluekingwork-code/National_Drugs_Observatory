// frontend/src/components/moys/MYSInterventionForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const INTERVENTION_TYPE_CHOICES = [
  { value: "life_skills", label: "Life Skills" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "job_readiness", label: "Job Readiness" },
  { value: "sports_development", label: "Sports for Development" },
  { value: "leadership_development", label: "Leadership Development" },
  { value: "civic_engagement", label: "Civic Engagement" },
  { value: "digital_skills", label: "Digital Skills" },
  { value: "financial_literacy", label: "Financial Literacy" },
  { value: "youth_participation", label: "Youth Participation" },
];

const COMPLETION_STATUS_CHOICES = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "partially_completed", label: "Partially Completed" },
  { value: "dropped_out", label: "Dropped Out" },
  { value: "on_hold", label: "On Hold" },
];

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
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

const Select = ({ label, value, onChange, options, required }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <select
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none bg-base-100"
      value={value || ""}
      onChange={onChange}
      required={required}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
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

export default function MYSInterventionForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    intervention_reference_id: initial?.intervention_reference_id || "",
    intervention_type: initial?.intervention_type || "",
    provider: initial?.provider || "",
    location: initial?.location || "",
    start_date: initial?.start_date || new Date().toISOString().split("T")[0],
    end_date: initial?.end_date || "",
    number_of_sessions: initial?.number_of_sessions || 0,
    sessions_attended: initial?.sessions_attended || 0,
    completion_status: initial?.completion_status || "not_started",
    certificate_issued: initial?.certificate_issued || "no",
    outcome_achieved: initial?.outcome_achieved || "",
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
        await moysService.interventions.update(initial.id, fd);
      } else {
        await moysService.interventions.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save intervention.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Intervention Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Intervention Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Reference ID" value={form.intervention_reference_id} onChange={(e) => set("intervention_reference_id", e.target.value)} required />
          <Select label="Intervention Type" value={form.intervention_type} onChange={(e) => set("intervention_type", e.target.value)} options={INTERVENTION_TYPE_CHOICES} required />
          <Input label="Provider" value={form.provider} onChange={(e) => set("provider", e.target.value)} required />
          <Input label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} required />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
          <Input label="End Date" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} required />
        </div>
      </section>

      {/* B. Participation */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Participation & Completion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Total Number of Sessions" type="number" value={form.number_of_sessions} onChange={(e) => set("number_of_sessions", parseInt(e.target.value) || 0)} required />
          <Input label="Sessions Attended" type="number" value={form.sessions_attended} onChange={(e) => set("sessions_attended", parseInt(e.target.value) || 0)} required />
          <Select label="Completion Status" value={form.completion_status} onChange={(e) => set("completion_status", e.target.value)} options={COMPLETION_STATUS_CHOICES} required />
          <Select label="Certificate Issued?" value={form.certificate_issued} onChange={(e) => set("certificate_issued", e.target.value)} options={YES_NO} />
        </div>
      </section>

      {/* C. Outcome */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Outcome Achieved</h3>
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Describe what the beneficiary achieved through this intervention" value={form.outcome_achieved} onChange={(e) => set("outcome_achieved", e.target.value)} required rows={3} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Intervention"}
        </button>
      </div>
    </form>
  );
}