// frontend/src/components/moys/MYSEmploymentForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const EMPLOYMENT_STATUS_CHOICES = [
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "seasonal", label: "Seasonal Employment" },
  { value: "other", label: "Other" },
];

const EMPLOYMENT_TYPE_CHOICES = [
  { value: "permanent", label: "Permanent" },
  { value: "temporary", label: "Temporary" },
  { value: "contract", label: "Contract" },
  { value: "part_time", label: "Part-Time" },
  { value: "full_time", label: "Full-Time" },
  { value: "casual", label: "Casual" },
  { value: "self_employment", label: "Self-Employment" },
  { value: "other", label: "Other" },
];

const APPRENTICESHIP_OUTCOME_CHOICES = [
  { value: "completed", label: "Completed" },
  { value: "ongoing", label: "Ongoing" },
  { value: "employed", label: "Employed After Apprenticeship" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "not_completed", label: "Not Completed" },
  { value: "other", label: "Other" },
];

const BUSINESS_STATUS_CHOICES = [
  { value: "operating", label: "Operating" },
  { value: "temporarily_closed", label: "Temporarily Closed" },
  { value: "permanently_closed", label: "Permanently Closed" },
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

export default function MYSEmploymentForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    emp_record_reference_id: initial?.emp_record_reference_id || "",
    
    // Employment
    employment_status: initial?.employment_status || "",
    employer: initial?.employer || "",
    employment_sector: initial?.employment_sector || "",
    job_title: initial?.job_title || "",
    employment_start_date: initial?.employment_start_date || "",
    employment_type: initial?.employment_type || "",
    current_employment_status: initial?.current_employment_status || "",

    // Apprenticeship
    apprenticeship_provider: initial?.apprenticeship_provider || "",
    apprenticeship_trade: initial?.apprenticeship_trade || "",
    apprenticeship_start_date: initial?.apprenticeship_start_date || "",
    apprenticeship_completion_date: initial?.apprenticeship_completion_date || "",
    apprenticeship_outcome: initial?.apprenticeship_outcome || "",

    // Business
    business_type: initial?.business_type || "",
    business_location: initial?.business_location || "",
    startup_support_received: initial?.startup_support_received || "",
    equipment_toolkit_received: initial?.equipment_toolkit_received || "",
    startup_capital: initial?.startup_capital || "",
    date_business_started: initial?.date_business_started || "",
    business_current_status: initial?.business_current_status || "",
    estimated_income_range: initial?.estimated_income_range || "",
    number_of_persons_employed: initial?.number_of_persons_employed || 0,
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
        await moysService.employment.update(initial.id, fd);
      } else {
        await moysService.employment.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save record.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Record Reference ID" value={form.emp_record_reference_id} onChange={(e) => set("emp_record_reference_id", e.target.value)} required />
      </div>

      {/* A. Employment */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Employment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Employment Status" value={form.employment_status} onChange={(e) => set("employment_status", e.target.value)} options={EMPLOYMENT_STATUS_CHOICES} />
          <Input label="Employer" value={form.employer} onChange={(e) => set("employer", e.target.value)} />
          <Input label="Employment Sector" value={form.employment_sector} onChange={(e) => set("employment_sector", e.target.value)} />
          <Input label="Job Title" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} />
          <Input label="Employment Start Date" type="date" value={form.employment_start_date} onChange={(e) => set("employment_start_date", e.target.value)} />
          <Select label="Employment Type" value={form.employment_type} onChange={(e) => set("employment_type", e.target.value)} options={EMPLOYMENT_TYPE_CHOICES} />
          <Select label="Current Employment Status" value={form.current_employment_status} onChange={(e) => set("current_employment_status", e.target.value)} options={EMPLOYMENT_STATUS_CHOICES} />
        </div>
      </section>

      {/* B. Apprenticeship */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Apprenticeship</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Provider" value={form.apprenticeship_provider} onChange={(e) => set("apprenticeship_provider", e.target.value)} />
          <Input label="Trade" value={form.apprenticeship_trade} onChange={(e) => set("apprenticeship_trade", e.target.value)} />
          <Input label="Start Date" type="date" value={form.apprenticeship_start_date} onChange={(e) => set("apprenticeship_start_date", e.target.value)} />
          <Input label="Completion Date" type="date" value={form.apprenticeship_completion_date} onChange={(e) => set("apprenticeship_completion_date", e.target.value)} />
          <Select label="Outcome" value={form.apprenticeship_outcome} onChange={(e) => set("apprenticeship_outcome", e.target.value)} options={APPRENTICESHIP_OUTCOME_CHOICES} />
        </div>
      </section>

      {/* C. Business Support */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Business Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Business Type" value={form.business_type} onChange={(e) => set("business_type", e.target.value)} />
          <Input label="Business Location" value={form.business_location} onChange={(e) => set("business_location", e.target.value)} />
          <Input label="Startup Capital" type="number" step="0.01" value={form.startup_capital} onChange={(e) => set("startup_capital", e.target.value)} />
          <Input label="Date Business Started" type="date" value={form.date_business_started} onChange={(e) => set("date_business_started", e.target.value)} />
          <Select label="Current Status" value={form.business_current_status} onChange={(e) => set("business_current_status", e.target.value)} options={BUSINESS_STATUS_CHOICES} />
          <Input label="Estimated Income Range" value={form.estimated_income_range} onChange={(e) => set("estimated_income_range", e.target.value)} placeholder="e.g. LRD 5,000 - 10,000" />
          <Input label="Number of Persons Employed" type="number" value={form.number_of_persons_employed} onChange={(e) => set("number_of_persons_employed", parseInt(e.target.value) || 0)} />
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-2">
          <Textarea label="Startup Support Received" value={form.startup_support_received} onChange={(e) => set("startup_support_received", e.target.value)} />
          <Textarea label="Equipment / Toolkit Received" value={form.equipment_toolkit_received} onChange={(e) => set("equipment_toolkit_received", e.target.value)} />
        </div>
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