// frontend/src/components/mog/FollowUpForm.jsx
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { mogService } from "../../services/mogService";
import { useAuth } from "../../contexts/AuthContext"; 

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

const RELATIONSHIPS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "grandparent", label: "Grandparent" },
  { value: "aunt_uncle", label: "Aunt / Uncle" },
  { value: "sibling", label: "Sibling" },
  { value: "cousin", label: "Cousin" },
  { value: "other", label: "Other" },
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

export default function FollowUpForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth();

  // --- Filter Counties based on User Scope ---
  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTIES;
    
    const normalizedAssigned = assigned.map(c => typeof c === 'string' ? c.toLowerCase() : c);
    return COUNTIES.filter((c) => normalizedAssigned.includes(c.value.toLowerCase()));
  }, [currentMembership]);

  const [form, setForm] = useState({
    person_id: initial?.person_id || "",
    child_code: initial?.child_code || "",
    visit_county: initial?.visit_county || "",
    
    location_house: initial?.location_house || "",
    street: initial?.street || "",
    town: initial?.town || "",
    district: initial?.district || "",
    county: initial?.county || "",
    country: initial?.country || "Liberia",
    
    caregiver_name: initial?.caregiver_name || "",
    caregiver_relationship: initial?.caregiver_relationship || "",
    contact_number: initial?.contact_number || "",
    
    visit_date: initial?.visit_date || new Date().toISOString().split("T")[0],
    visit_number: initial?.visit_number || "",
    child_seen: initial?.child_seen || false,
    seen_alone: initial?.seen_alone || false,
    
    followup_date: initial?.followup_date || "",
    previous_followup_date: initial?.previous_followup_date || "",
    
    action_followed: initial?.action_followed || false,
    action_service: initial?.action_service || "",
    purpose_of_followup: initial?.purpose_of_followup || "",
    followup_details: initial?.followup_details || "",
    action_conducted: initial?.action_conducted || "",
    situation_change: initial?.situation_change || "",
    
    appearance: initial?.appearance || "",
    psychological_notes: initial?.psychological_notes || "",
    
    health_status: initial?.health_status || "",
    health_notes: initial?.health_notes || "",
    frequently_sick: initial?.frequently_sick || false,
    
    protection_issues: initial?.protection_issues || "",
    
    caseworker_name: initial?.caseworker_name || "",
    agency: initial?.agency || "",
    signature: initial?.signature || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form };
      const dateFields = ["followup_date", "previous_followup_date", "visit_date"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (isEditing) {
        await mogService.followups.update(initial.id, payload);
      } else {
        await mogService.followups.create(payload);
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
      
      {/* ================= VISIT METADATA ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Visit Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Child Code" value={form.child_code} onChange={(e) => set("child_code", e.target.value)} />
          <Input label="Visit Date" type="date" value={form.visit_date} onChange={(e) => set("visit_date", e.target.value)} />
          <Input label="Visit Number" type="number" value={form.visit_number} onChange={(e) => set("visit_number", e.target.value)} />
          
          {/* SCOPED: Uses allowedCounties */}
          <Select label="Visit County" value={form.visit_county} onChange={(e) => set("visit_county", e.target.value)} options={allowedCounties} />
          
          <Input label="Previous Followup Date" type="date" value={form.previous_followup_date} onChange={(e) => set("previous_followup_date", e.target.value)} />
          <Input label="Followup Date" type="date" value={form.followup_date} onChange={(e) => set("followup_date", e.target.value)} />
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.child_seen} onChange={(e) => set("child_seen", e.target.checked)} />
            Child seen
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.seen_alone} onChange={(e) => set("seen_alone", e.target.checked)} />
            Seen alone
          </label>
        </div>
      </section>

      {/* ================= LOCATION & CAREGIVER ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Location & Caregiver</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="House" value={form.location_house} onChange={(e) => set("location_house", e.target.value)} />
          <Input label="Street" value={form.street} onChange={(e) => set("street", e.target.value)} />
          <Input label="Town" value={form.town} onChange={(e) => set("town", e.target.value)} />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          
          {/* NOT SCOPED: Uses full COUNTIES list */}
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={COUNTIES} />
          
          <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Input label="Caregiver Name" value={form.caregiver_name} onChange={(e) => set("caregiver_name", e.target.value)} />
          <Select label="Relationship" value={form.caregiver_relationship} onChange={(e) => set("caregiver_relationship", e.target.value)} options={RELATIONSHIPS} />
          <Input label="Contact Number" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} />
        </div>
      </section>

      {/* ================= FOLLOW-UP DETAILS ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Follow-up Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Purpose of Follow-up" value={form.purpose_of_followup} onChange={(e) => set("purpose_of_followup", e.target.value)} />
          <Input label="Action Conducted" value={form.action_conducted} onChange={(e) => set("action_conducted", e.target.value)} />
          <Textarea label="Follow-up Details" value={form.followup_details} onChange={(e) => set("followup_details", e.target.value)} />
          <Textarea label="Action Service" value={form.action_service} onChange={(e) => set("action_service", e.target.value)} />
          <Input label="Situation Change" value={form.situation_change} onChange={(e) => set("situation_change", e.target.value)} />
          <Textarea label="Protection Issues" value={form.protection_issues} onChange={(e) => set("protection_issues", e.target.value)} />
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.action_followed} onChange={(e) => set("action_followed", e.target.checked)} />
            Action Followed
          </label>
        </div>
      </section>

      {/* ================= PSYCHOLOGICAL & HEALTH ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Psych & Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Appearance" value={form.appearance} onChange={(e) => set("appearance", e.target.value)} />
          <Input label="Health Status" value={form.health_status} onChange={(e) => set("health_status", e.target.value)} />
          <Textarea label="Psychological Notes" value={form.psychological_notes} onChange={(e) => set("psychological_notes", e.target.value)} />
          <Textarea label="Health Notes" value={form.health_notes} onChange={(e) => set("health_notes", e.target.value)} />
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.frequently_sick} onChange={(e) => set("frequently_sick", e.target.checked)} />
            Frequently Sick
          </label>
        </div>
      </section>

      {/* ================= CASEWORKER ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Caseworker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} />
          <Input label="Agency" value={form.agency} onChange={(e) => set("agency", e.target.value)} />
          <Input label="Signature" value={form.signature} onChange={(e) => set("signature", e.target.value)} />
        </div>
      </section>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Create Follow-up"}
        </button>
      </div>
    </form>
  );
}