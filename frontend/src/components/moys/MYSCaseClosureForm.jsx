// frontend/src/components/moys/MYSCaseClosureForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const FINAL_OUTCOME_CHOICES = [
  { value: "reintegrated", label: "Successfully Reintegrated" },
  { value: "partially_reintegrated", label: "Partially Reintegrated" },
  { value: "referred", label: "Referred to Another Institution" },
  { value: "dropped_out", label: "Dropped Out" },
  { value: "relocated", label: "Relocated" },
  { value: "other", label: "Other" },
];

const REINTEGRATION_STATUS_CHOICES = [
  { value: "stable", label: "Stable" },
  { value: "progressing", label: "Progressing" },
  { value: "needs_support", label: "Needs Support" },
  { value: "not_applicable", label: "Not Applicable" },
];

const YES_NO_CHOICES = [
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

export default function MYSCaseClosureForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    closure_reference_id: initial?.closure_reference_id || "",
    aryep_registration_number: initial?.aryep_registration_number || "",
    date_enrolled: initial?.date_enrolled || "",
    date_of_closure: initial?.date_of_closure || new Date().toISOString().split("T")[0],
    
    final_outcome: initial?.final_outcome || "",
    other_final_outcome: initial?.other_final_outcome || "",
    overall_reintegration_status: initial?.overall_reintegration_status || "",
    reason_for_closure: initial?.reason_for_closure || "",
    further_follow_up_required: initial?.further_follow_up_required || "no",
    mys_officer: initial?.mys_officer || "",
    supervisor: initial?.supervisor || "",
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
        await moysService.caseClosures.update(initial.id, fd);
      } else {
        await moysService.caseClosures.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save case closure.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Case Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Case Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Closure Reference ID" value={form.closure_reference_id} onChange={(e) => set("closure_reference_id", e.target.value)} required />
          <Input label="ARYEP Registration No." value={form.aryep_registration_number} onChange={(e) => set("aryep_registration_number", e.target.value)} />
          <Input label="Date Enrolled" type="date" value={form.date_enrolled} onChange={(e) => set("date_enrolled", e.target.value)} required />
          <Input label="Date of Closure" type="date" value={form.date_of_closure} onChange={(e) => set("date_of_closure", e.target.value)} required />
        </div>
      </section>

      {/* B. Final Outcome */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Final Outcome</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Final Outcome" value={form.final_outcome} onChange={(e) => set("final_outcome", e.target.value)} options={FINAL_OUTCOME_CHOICES} required />
          
          {form.final_outcome === "other" && (
            <Input label="Specify Other Outcome" value={form.other_final_outcome} onChange={(e) => set("other_final_outcome", e.target.value)} required />
          )}
        </div>
      </section>

      {/* C. Final Assessment */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Final Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select label="Overall Reintegration Status" value={form.overall_reintegration_status} onChange={(e) => set("overall_reintegration_status", e.target.value)} options={REINTEGRATION_STATUS_CHOICES} required />
          <Select label="Further Follow-Up Required?" value={form.further_follow_up_required} onChange={(e) => set("further_follow_up_required", e.target.value)} options={YES_NO_CHOICES} required />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Reason for Closure" value={form.reason_for_closure} onChange={(e) => set("reason_for_closure", e.target.value)} required rows={3} />
        </div>
      </section>

      {/* D. Responsible Officers */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">D. Responsible Officers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="MYS Officer" value={form.mys_officer} onChange={(e) => set("mys_officer", e.target.value)} required />
          <Input label="Supervisor" value={form.supervisor} onChange={(e) => set("supervisor", e.target.value)} required />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Case Closure"}
        </button>
      </div>
    </form>
  );
}