// frontend/src/components/moys/MYSFamilyReintegrationForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const FAMILY_REUNIFICATION_CHOICES = [
  { value: "reunited", label: "Reunited" },
  { value: "pending", label: "Pending" },
  { value: "not_applicable", label: "Not Applicable" },
];

const ACCEPTANCE_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "partial", label: "Partial" },
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

export default function MYSFamilyReintegrationForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    reintegration_reference_id: initial?.reintegration_reference_id || "",
    family_reunification_status: initial?.family_reunification_status || "pending",
    date_reunited: initial?.date_reunited || "",
    family_community_location: initial?.family_community_location || "",
    
    accepted_by_family: initial?.accepted_by_family || "",
    accepted_by_community: initial?.accepted_by_community || "",
    participating_in_community_activities: initial?.participating_in_community_activities || "",
    member_of_youth_organization: initial?.member_of_youth_organization || "",
    member_of_peer_support_group: initial?.member_of_peer_support_group || "",
    participating_in_community_service: initial?.participating_in_community_service || "",
    participating_in_leadership_activities: initial?.participating_in_leadership_activities || "",

    social_cohesion_activity: initial?.social_cohesion_activity || "",
    conflict_resolution_activity: initial?.conflict_resolution_activity || "",
    activity_date: initial?.activity_date || "",
    outcome: initial?.outcome || "",
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
        await moysService.familyReintegration.update(initial.id, fd);
      } else {
        await moysService.familyReintegration.create(fd);
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
      
      {/* A. Family Reintegration */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Family Reintegration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Reference ID" value={form.reintegration_reference_id} onChange={(e) => set("reintegration_reference_id", e.target.value)} required />
          <Select label="Reunification Status" value={form.family_reunification_status} onChange={(e) => set("family_reunification_status", e.target.value)} options={FAMILY_REUNIFICATION_CHOICES} required />
          
          {form.family_reunification_status === "reunited" && (
            <Input label="Date Reunited" type="date" value={form.date_reunited} onChange={(e) => set("date_reunited", e.target.value)} required />
          )}
          
          <Input label="Family/Community Location" value={form.family_community_location} onChange={(e) => set("family_community_location", e.target.value)} />
        </div>
      </section>

      {/* B. Community Reintegration */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Community Reintegration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Accepted by Family" value={form.accepted_by_family} onChange={(e) => set("accepted_by_family", e.target.value)} options={ACCEPTANCE_CHOICES} />
          <Select label="Accepted by Community" value={form.accepted_by_community} onChange={(e) => set("accepted_by_community", e.target.value)} options={ACCEPTANCE_CHOICES} />
          
          <Select label="Participating in Community Activities?" value={form.participating_in_community_activities} onChange={(e) => set("participating_in_community_activities", e.target.value)} options={YES_NO} />
          <Select label="Member of Youth Organization?" value={form.member_of_youth_organization} onChange={(e) => set("member_of_youth_organization", e.target.value)} options={YES_NO} />
          <Select label="Member of Peer Support Group?" value={form.member_of_peer_support_group} onChange={(e) => set("member_of_peer_support_group", e.target.value)} options={YES_NO} />
          <Select label="Participating in Community Service?" value={form.participating_in_community_service} onChange={(e) => set("participating_in_community_service", e.target.value)} options={YES_NO} />
          <Select label="Participating in Leadership Activities?" value={form.participating_in_leadership_activities} onChange={(e) => set("participating_in_leadership_activities", e.target.value)} options={YES_NO} />
        </div>
      </section>

      {/* C. Social Cohesion */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Social Cohesion Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Activity Date" type="date" value={form.activity_date} onChange={(e) => set("activity_date", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Social Cohesion Activity" value={form.social_cohesion_activity} onChange={(e) => set("social_cohesion_activity", e.target.value)} />
          <Textarea label="Conflict Resolution Activity" value={form.conflict_resolution_activity} onChange={(e) => set("conflict_resolution_activity", e.target.value)} />
          <Textarea label="Outcome" value={form.outcome} onChange={(e) => set("outcome", e.target.value)} />
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