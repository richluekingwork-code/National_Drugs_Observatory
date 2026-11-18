// frontend/src/components/mog/HandoverForm.jsx
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { mogService } from "../../services/mogService";
import { useAuth } from "../../contexts/AuthContext"; // <-- Added

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

export default function HandoverForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth(); // <-- Added

  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTIES;
    const normalizedAssigned = assigned.map(c => typeof c === 'string' ? c.toLowerCase() : c);
    return COUNTIES.filter((c) => normalizedAssigned.includes(c.value.toLowerCase()));
  }, [currentMembership]);

  const [form, setForm] = useState({
    person_id: initial?.person_id || "",
    follow_county: initial?.follow_county || "",
    reunification_type: initial?.reunification_type || "",
    
    adult_verification: initial?.adult_verification || false,
    child_verification: initial?.child_verification || false,
    relationship_verified: initial?.relationship_verified || false,
    ongoing_support_needed: initial?.ongoing_support_needed || false,
    
    caseworker_name: initial?.caseworker_name || "",
    organization: initial?.organization || "",
    
    caregiver1_name: initial?.caregiver1_name || "",
    caregiver1_sex: initial?.caregiver1_sex || "",
    caregiver1_relationship: initial?.caregiver1_relationship || "",
    
    caregiver2_name: initial?.caregiver2_name || "",
    caregiver2_sex: initial?.caregiver2_sex || "",
    caregiver2_relationship: initial?.caregiver2_relationship || "",
    
    address: initial?.address || "",
    phone: initial?.phone || "",
    town_village: initial?.town_village || "",
    clan: initial?.clan || "",
    district: initial?.district || "",
    county: initial?.county || "",
    country: initial?.country || "Liberia",
    
    reunification_date: initial?.reunification_date || new Date().toISOString().split("T")[0],
    reunification_place: initial?.reunification_place || "",
    
    consent_person: initial?.consent_person || "",
    child_name: initial?.child_name || "",
    agreement_statement: initial?.agreement_statement || "",
    
    caseworker_signature: initial?.caseworker_signature || "",
    receiver_signature: initial?.receiver_signature || "",
    witness_signature: initial?.witness_signature || "",
    
    additional_information: initial?.additional_information || "",
    new_address_location: initial?.new_address_location || "",
    signature_date: initial?.signature_date || "",
    signature_place: initial?.signature_place || "",
    siblings_reunified: initial?.siblings_reunified || "",
    
    supervisor_name: initial?.supervisor_name || "",
    supervisor_position: initial?.supervisor_position || "",
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
      const dateFields = ["reunification_date", "signature_date"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (isEditing) {
        await mogService.handovers.update(initial.id, payload);
      } else {
        await mogService.handovers.create(payload);
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
      
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Reunification Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Reunification Type" value={form.reunification_type} onChange={(e) => set("reunification_type", e.target.value)} required />
          <Input label="Reunification Date" type="date" value={form.reunification_date} onChange={(e) => set("reunification_date", e.target.value)} required />
          <Input label="Reunification Place" value={form.reunification_place} onChange={(e) => set("reunification_place", e.target.value)} required />
          
          {/* SCOPED: Uses allowedCounties */}
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
        </div>
        <div className="flex flex-wrap gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.adult_verification} onChange={(e) => set("adult_verification", e.target.checked)} />
            Adult Verified
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.child_verification} onChange={(e) => set("child_verification", e.target.checked)} />
            Child Verified
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.relationship_verified} onChange={(e) => set("relationship_verified", e.target.checked)} />
            Relationship Verified
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.ongoing_support_needed} onChange={(e) => set("ongoing_support_needed", e.target.checked)} />
            Ongoing Support Needed
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Caregiver Details</h3>
        
        <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mt-2">Caregiver 1</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Full Name" value={form.caregiver1_name} onChange={(e) => set("caregiver1_name", e.target.value)} required />
          <Input label="Sex" value={form.caregiver1_sex} onChange={(e) => set("caregiver1_sex", e.target.value)} />
          <Select label="Relationship" value={form.caregiver1_relationship} onChange={(e) => set("caregiver1_relationship", e.target.value)} options={RELATIONSHIPS} />
        </div>

        <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mt-4">Caregiver 2 (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Full Name" value={form.caregiver2_name} onChange={(e) => set("caregiver2_name", e.target.value)} />
          <Input label="Sex" value={form.caregiver2_sex} onChange={(e) => set("caregiver2_sex", e.target.value)} />
          <Select label="Relationship" value={form.caregiver2_relationship} onChange={(e) => set("caregiver2_relationship", e.target.value)} options={RELATIONSHIPS} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} required />
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Town / Village" value={form.town_village} onChange={(e) => set("town_village", e.target.value)} />
          <Input label="Clan" value={form.clan} onChange={(e) => set("clan", e.target.value)} />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          
          {/* NOT SCOPED: Uses full list */}
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={COUNTIES} />
          
          <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Agreements & Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Consent Person" value={form.consent_person} onChange={(e) => set("consent_person", e.target.value)} />
          <Input label="Child Name" value={form.child_name} onChange={(e) => set("child_name", e.target.value)} />
          <Textarea label="Agreement Statement" value={form.agreement_statement} onChange={(e) => set("agreement_statement", e.target.value)} />
          <Input label="Caseworker Signature" value={form.caseworker_signature} onChange={(e) => set("caseworker_signature", e.target.value)} />
          <Input label="Receiver Signature" value={form.receiver_signature} onChange={(e) => set("receiver_signature", e.target.value)} />
          <Input label="Witness Signature" value={form.witness_signature} onChange={(e) => set("witness_signature", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Additional Information & Staff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="New Address Location" value={form.new_address_location} onChange={(e) => set("new_address_location", e.target.value)} />
          <Input label="Siblings Reunified" value={form.siblings_reunified} onChange={(e) => set("siblings_reunified", e.target.value)} />
          <Input label="Signature Date" type="date" value={form.signature_date} onChange={(e) => set("signature_date", e.target.value)} />
          <Input label="Signature Place" value={form.signature_place} onChange={(e) => set("signature_place", e.target.value)} />
          <Textarea label="Additional Information" value={form.additional_information} onChange={(e) => set("additional_information", e.target.value)} />
          
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} required />
          <Input label="Organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} required />
          <Input label="Supervisor Name" value={form.supervisor_name} onChange={(e) => set("supervisor_name", e.target.value)} />
          <Input label="Supervisor Position" value={form.supervisor_position} onChange={(e) => set("supervisor_position", e.target.value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Handover"}
        </button>
      </div>
    </form>
  );
}