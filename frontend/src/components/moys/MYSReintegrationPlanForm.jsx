// frontend/src/components/moys/MYSReintegrationPlanForm.jsx
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

const toJsonString = (val) => {
  if (!val) return "[]";
  if (typeof val === "string") {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return "[]";
    }
  }
  return JSON.stringify(val);
};

const NEEDS_FIELDS = ["area", "description", "priority"];
const ACTIVITIES_FIELDS = ["activity", "provider", "start_date", "end_date", "status"];

export default function MYSReintegrationPlanForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    plan_reference_id: initial?.plan_reference_id || "",
    date_of_plan: initial?.date_of_plan || new Date().toISOString().split("T")[0],
    mys_officer_case_manager: initial?.mys_officer_case_manager || "",
    primary_goal: initial?.primary_goal || "",
    expected_outcome: initial?.expected_outcome || "",
    
    // JSON Arrays
    identified_needs: toJsonString(initial?.identified_needs),
    intervention_activities: toJsonString(initial?.intervention_activities),
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
        await moysService.plans.update(initial.id, fd);
      } else {
        await moysService.plans.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save plan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Plan Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Plan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Plan Reference ID" value={form.plan_reference_id} onChange={(e) => set("plan_reference_id", e.target.value)} required />
          <Input label="Date of Plan" type="date" value={form.date_of_plan} onChange={(e) => set("date_of_plan", e.target.value)} required />
          <Input label="MYS Officer / Case Manager" value={form.mys_officer_case_manager} onChange={(e) => set("mys_officer_case_manager", e.target.value)} required />
        </div>
      </section>

      {/* B. Identified Needs */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Identified Needs</h3>
        <JSONListInput 
          label="List of Identified Needs" 
          value={form.identified_needs} 
          onChange={(v) => set("identified_needs", v)} 
          fields={NEEDS_FIELDS} 
        />
      </section>

      {/* C. Individual Intervention Plan */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Intervention Activities</h3>
        <JSONListInput 
          label="Planned Interventions" 
          value={form.intervention_activities} 
          onChange={(v) => set("intervention_activities", v)} 
          fields={ACTIVITIES_FIELDS} 
        />
      </section>

      {/* D. Reintegration Goal */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">D. Reintegration Goal</h3>
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Primary Goal" value={form.primary_goal} onChange={(e) => set("primary_goal", e.target.value)} required rows={3} />
          <Textarea label="Expected Outcome" value={form.expected_outcome} onChange={(e) => set("expected_outcome", e.target.value)} required rows={3} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Plan"}
        </button>
      </div>
    </form>
  );
}