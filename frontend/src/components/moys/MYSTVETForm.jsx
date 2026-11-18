// frontend/src/components/moys/MYSTVETForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";
import JSONListInput from "./JSONListInput";

const TRAINING_LEVEL_CHOICES = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" },
];

const POST_TRAINING_CHOICES = [
  { value: "employment", label: "Employment" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "business_startup", label: "Business/Start-up" },
  { value: "further_training", label: "Further Training" },
  { value: "other", label: "Other" },
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

const Textarea = ({ label, value, onChange, rows = 2, required }) => (
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

const toJsonString = (val) => {
  if (!val) return "[]";
  if (typeof val === "string") {
    try { JSON.parse(val); return val; } catch { return "[]"; }
  }
  return JSON.stringify(val);
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

const ATTENDANCE_FIELDS = ["period", "attendance", "progress", "remarks"];

export default function MYSTVETForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    tvet_reference_id: initial?.tvet_reference_id || "",
    training_institution: initial?.training_institution || "",
    trade: initial?.trade || "",
    training_level: initial?.training_level || "",
    enrollment_date: initial?.enrollment_date || new Date().toISOString().split("T")[0],
    expected_completion: initial?.expected_completion || "",
    actual_completion: initial?.actual_completion || "",
    completed_training: initial?.completed_training || "no",
    certification_obtained: initial?.certification_obtained || "no",
    certificate_number: initial?.certificate_number || "",
    certificate_date: initial?.certificate_date || "",
    reason_for_non_completion: initial?.reason_for_non_completion || "",
    post_training_outcome: normalizeArray(initial?.post_training_outcome),
    other_post_training_details: initial?.other_post_training_details || "",
    
    // JSON
    attendance_progress: toJsonString(initial?.attendance_progress),
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleOutcome = (val) => {
    setForm((f) => {
      const outcomes = f.post_training_outcome.includes(val)
        ? f.post_training_outcome.filter((o) => o !== val)
        : [...f.post_training_outcome, val];
      return { ...f, post_training_outcome: outcomes };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      
      Object.keys(form).forEach((key) => {
        if (key === "post_training_outcome") return; // Handle separately
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });

      fd.append("post_training_outcome", JSON.stringify(form.post_training_outcome));

      if (!isEditing && initial?.person_id) {
        fd.append("beneficiary_id", initial.person_id);
      }

      if (isEditing) {
        await moysService.tvet.update(initial.id, fd);
      } else {
        await moysService.tvet.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
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
      
      {/* A. Training Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Training Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="TVET Reference ID" value={form.tvet_reference_id} onChange={(e) => set("tvet_reference_id", e.target.value)} required />
          <Input label="Training Institution" value={form.training_institution} onChange={(e) => set("training_institution", e.target.value)} required />
          <Input label="Trade / Course" value={form.trade} onChange={(e) => set("trade", e.target.value)} required />
          <Select label="Training Level" value={form.training_level} onChange={(e) => set("training_level", e.target.value)} options={TRAINING_LEVEL_CHOICES} required />
          <Input label="Enrollment Date" type="date" value={form.enrollment_date} onChange={(e) => set("enrollment_date", e.target.value)} required />
          <Input label="Expected Completion" type="date" value={form.expected_completion} onChange={(e) => set("expected_completion", e.target.value)} required />
        </div>
      </section>

      {/* B. Attendance & Progress */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Attendance & Progress</h3>
        <JSONListInput 
          label="Attendance Records" 
          value={form.attendance_progress} 
          onChange={(v) => set("attendance_progress", v)} 
          fields={ATTENDANCE_FIELDS} 
        />
      </section>

      {/* C. Completion */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Completion Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Completed Training?" value={form.completed_training} onChange={(e) => set("completed_training", e.target.value)} options={YES_NO} />
          
          {form.completed_training === "yes" && (
            <>
              <Input label="Actual Completion Date" type="date" value={form.actual_completion} onChange={(e) => set("actual_completion", e.target.value)} required />
              <Select label="Certification Obtained?" value={form.certification_obtained} onChange={(e) => set("certification_obtained", e.target.value)} options={YES_NO} />
              {form.certification_obtained === "yes" && (
                <>
                  <Input label="Certificate Number" value={form.certificate_number} onChange={(e) => set("certificate_number", e.target.value)} required />
                  <Input label="Certificate Date" type="date" value={form.certificate_date} onChange={(e) => set("certificate_date", e.target.value)} />
                </>
              )}
            </>
          )}

          {form.completed_training === "no" && (
            <div className="md:col-span-3">
              <Textarea label="Reason for Non-Completion" value={form.reason_for_non_completion} onChange={(e) => set("reason_for_non_completion", e.target.value)} required rows={2} />
            </div>
          )}
        </div>
      </section>

      {/* D. Post-Training Outcome */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">D. Post-Training Outcome</h3>
        
        <div className="mt-4">
          <p className="text-xs font-medium text-base-content/70 mb-2">Select Post-Training Outcomes:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-base-200/50 p-4 rounded-lg border border-base-300">
            {POST_TRAINING_CHOICES.map((outcome) => (
              <label key={outcome.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={form.post_training_outcome.includes(outcome.value)}
                  onChange={() => toggleOutcome(outcome.value)}
                />
                {outcome.label}
              </label>
            ))}
          </div>
        </div>

        {form.post_training_outcome.includes("other") && (
          <div className="mt-4">
            <Input label="Other Outcome Details" value={form.other_post_training_details} onChange={(e) => set("other_post_training_details", e.target.value)} required />
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Record"}
        </button>
      </div>
    </form>
  );
}