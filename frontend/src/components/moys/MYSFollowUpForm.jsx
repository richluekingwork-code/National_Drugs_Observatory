// frontend/src/components/moys/MYSFollowUpForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const FOLLOW_UP_PERIOD_CHOICES = [
  { value: "1_month", label: "1 Month" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "12_months", label: "12 Months" },
  { value: "other", label: "Other" },
];

const STATUS_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "partial", label: "Partially" },
];

const CURRENT_STATUS_CHOICES = [
  { value: "stable", label: "Stable" },
  { value: "progressing", label: "Progressing" },
  { value: "needs_support", label: "Needs Support" },
  { value: "not_applicable", label: "Not Applicable" },
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

export default function MYSFollowUpForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    follow_up_reference_id: initial?.follow_up_reference_id || "",
    follow_up_period: initial?.follow_up_period || "",
    other_follow_up_period: initial?.other_follow_up_period || "",
    follow_up_date: initial?.follow_up_date || new Date().toISOString().split("T")[0],
    
    employment_status: initial?.employment_status || "",
    business_status: initial?.business_status || "",
    education_status: initial?.education_status || "",
    family_situation_status: initial?.family_situation_status || "",
    community_participation_status: initial?.community_participation_status || "",
    peer_support_status: initial?.peer_support_status || "",
    mentorship_status: initial?.mentorship_status || "",

    reintegration_progressing: initial?.reintegration_progressing || "",
    additional_support_required: initial?.additional_support_required || "",
    referral_required: initial?.referral_required || "",
    referral_made_to: initial?.referral_made_to || "",
    referral_date: initial?.referral_date || "",
    outcome: initial?.outcome || "",
    follow_up_officer: initial?.follow_up_officer || "",
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
        await moysService.followUps.update(initial.id, fd);
      } else {
        await moysService.followUps.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save follow-up.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Follow-Up Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Follow-Up Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Reference ID" value={form.follow_up_reference_id} onChange={(e) => set("follow_up_reference_id", e.target.value)} required />
          <Select label="Follow-Up Period" value={form.follow_up_period} onChange={(e) => set("follow_up_period", e.target.value)} options={FOLLOW_UP_PERIOD_CHOICES} required />
          
          {form.follow_up_period === "other" && (
            <Input label="Specify Other Period" value={form.other_follow_up_period} onChange={(e) => set("other_follow_up_period", e.target.value)} required />
          )}
          
          <Input label="Follow-Up Date" type="date" value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} required />
        </div>
      </section>

      {/* B. Current Status */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Current Reintegration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select label="Employment" value={form.employment_status} onChange={(e) => set("employment_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Business" value={form.business_status} onChange={(e) => set("business_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Education" value={form.education_status} onChange={(e) => set("education_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Family Situation" value={form.family_situation_status} onChange={(e) => set("family_situation_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Community Participation" value={form.community_participation_status} onChange={(e) => set("community_participation_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Peer Support" value={form.peer_support_status} onChange={(e) => set("peer_support_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
          <Select label="Mentorship" value={form.mentorship_status} onChange={(e) => set("mentorship_status", e.target.value)} options={CURRENT_STATUS_CHOICES} />
        </div>
      </section>

      {/* C. Findings & Outcomes */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Follow-Up Findings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select label="Reintegration Progressing?" value={form.reintegration_progressing} onChange={(e) => set("reintegration_progressing", e.target.value)} options={STATUS_CHOICES} />
          <Select label="Additional Support Required?" value={form.additional_support_required} onChange={(e) => set("additional_support_required", e.target.value)} options={YES_NO} />
          <Select label="Referral Required?" value={form.referral_required} onChange={(e) => set("referral_required", e.target.value)} options={YES_NO} />
          
          {form.referral_required === "yes" && (
            <>
              <Input label="Referral Made To" value={form.referral_made_to} onChange={(e) => set("referral_made_to", e.target.value)} required />
              <Input label="Referral Date" type="date" value={form.referral_date} onChange={(e) => set("referral_date", e.target.value)} />
            </>
          )}
          
          <Input label="Follow-Up Officer" value={form.follow_up_officer} onChange={(e) => set("follow_up_officer", e.target.value)} required />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Outcome / Remarks" value={form.outcome} onChange={(e) => set("outcome", e.target.value)} rows={3} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Follow-Up"}
        </button>
      </div>
    </form>
  );
}