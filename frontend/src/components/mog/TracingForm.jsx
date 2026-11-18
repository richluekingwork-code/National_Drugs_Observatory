// frontend/src/components/mog/TracingForm.jsx
import { useState, useMemo } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { mogService } from "../../services/mogService";
import { useAuth } from "../../contexts/AuthContext"; // <-- ADDED

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

const CENTER_TYPES = [
  { value: "orphanage", label: "Orphanage" },
  { value: "adoption_agency", label: "Adoption Agency / Transit Home" },
  { value: "safe_home", label: "Safe Home" },
  { value: "specialized_home", label: "Specialized Home" },
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

export default function TracingForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth(); // <-- ADDED

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
    follow_county: initial?.follow_county || "",
    center_type: initial?.center_type || "",
    center_type_other: initial?.center_type_other || "",
    separated_child: initial?.separated_child || false,
    
    mother_name: initial?.mother_name || "",
    mother_alive: initial?.mother_alive ?? null,
    father_name: initial?.father_name || "",
    father_alive: initial?.father_alive ?? null,
    guardian_alive: initial?.guardian_alive ?? null,
    parent_status: initial?.parent_status || "",
    
    house_location: initial?.house_location || "",
    street: initial?.street || "",
    town: initial?.town || "",
    district: initial?.district || "",
    county: initial?.county || "",
    country: initial?.country || "Liberia",
    address_information: initial?.address_information || "",
    child_life_information: initial?.child_life_information || "",
    child_memorable_events: initial?.child_memorable_events || "",
    
    child_id_evidence: initial?.child_id_evidence || false,
    birth_certificate_evidence: initial?.birth_certificate_evidence || false,
    photos_evidence: initial?.photos_evidence || false,
    other_evidence: initial?.other_evidence || "",
    child_identification_information: initial?.child_identification_information || "",
    
    separation_date: initial?.separation_date || "",
    separation_address: initial?.separation_address || "",
    separated_from_name: initial?.separated_from_name || "",
    relationship_to_child: initial?.relationship_to_child || "",
    separation_circumstances: initial?.separation_circumstances || "",
    main_cause_of_separation: initial?.main_cause_of_separation || "",
    
    traced_person_name: initial?.traced_person_name || "",
    traced_person_age: initial?.traced_person_age || "",
    traced_person_contact: initial?.traced_person_contact || "",
    traced_person_gender: initial?.traced_person_gender || "",
    traced_person_relationship: initial?.traced_person_relationship || "",
    traced_person_occupation: initial?.traced_person_occupation || "",
    
    wants_child: initial?.wants_child ?? null,
    able_to_take_care: initial?.able_to_take_care ?? null,
    alternative_family_available: initial?.alternative_family_available ?? null,
    agreement_take_child: initial?.agreement_take_child || false,
    signature_name: initial?.signature_name || "",
    
    child_return_information: initial?.child_return_information || "",
    caseworker_observation: initial?.caseworker_observation || "",
    caseworker_name: initial?.caseworker_name || "",
    caseworker_date: initial?.caseworker_date || new Date().toISOString().split("T")[0],
    organization: initial?.organization || "",
  });

  const [familyMembers, setFamilyMembers] = useState(initial?.family_members || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addMember = () => setFamilyMembers([...familyMembers, { name: "", relationship: "", address: "" }]);
  const updateMember = (i, k, v) => {
    const next = [...familyMembers];
    next[i][k] = v;
    setFamilyMembers(next);
  };
  const removeMember = (i) => setFamilyMembers(familyMembers.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form, family_members: familyMembers };
      if (!payload.separation_date) payload.separation_date = null;
      if (!payload.caseworker_date) payload.caseworker_date = null;
      
      if (isEditing) {
        await mogService.tracings.update(initial.id, payload);
      } else {
        await mogService.tracings.create(payload);
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
      
      {/* ================= BASIC INFO ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Child Code" value={form.child_code} onChange={(e) => set("child_code", e.target.value)} />
          
          {/* SCOPED: Uses allowedCounties */}
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
          
          <Select label="Center Type" value={form.center_type} onChange={(e) => set("center_type", e.target.value)} options={CENTER_TYPES} />
          {form.center_type === "other" && (
            <Input label="Specify Center Type" value={form.center_type_other} onChange={(e) => set("center_type_other", e.target.value)} />
          )}
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.separated_child} onChange={(e) => set("separated_child", e.target.checked)} />
            Separated Child
          </label>
        </div>
      </section>

      {/* ================= FAMILY HISTORY ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Family History</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Mother's Name" value={form.mother_name} onChange={(e) => set("mother_name", e.target.value)} />
          <Input label="Father's Name" value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          <Input label="Parent Status" value={form.parent_status} onChange={(e) => set("parent_status", e.target.value)} />
          
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-6">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.mother_alive || false} onChange={(e) => set("mother_alive", e.target.checked)} />
            Mother Alive
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-6">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.father_alive || false} onChange={(e) => set("father_alive", e.target.checked)} />
            Father Alive
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-6">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.guardian_alive || false} onChange={(e) => set("guardian_alive", e.target.checked)} />
            Guardian Alive
          </label>
        </div>
      </section>

      {/* ================= BEFORE SEPARATION ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Before Separation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="House Location" value={form.house_location} onChange={(e) => set("house_location", e.target.value)} />
          <Input label="Street" value={form.street} onChange={(e) => set("street", e.target.value)} />
          <Input label="Town" value={form.town} onChange={(e) => set("town", e.target.value)} />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          
          {/* NOT SCOPED: Uses full COUNTIES list */}
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={COUNTIES} />
          
          <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Textarea label="Address Information" value={form.address_information} onChange={(e) => set("address_information", e.target.value)} />
          <Textarea label="Child Life Information" value={form.child_life_information} onChange={(e) => set("child_life_information", e.target.value)} />
          <Textarea label="Child Memorable Events" value={form.child_memorable_events} onChange={(e) => set("child_memorable_events", e.target.value)} />
        </div>
      </section>

      {/* ================= EVIDENCE ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Evidence & Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Other Evidence" value={form.other_evidence} onChange={(e) => set("other_evidence", e.target.value)} />
          <Textarea label="Child Identification Information" value={form.child_identification_information} onChange={(e) => set("child_identification_information", e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.child_id_evidence} onChange={(e) => set("child_id_evidence", e.target.checked)} />
            Child ID Evidence
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.birth_certificate_evidence} onChange={(e) => set("birth_certificate_evidence", e.target.checked)} />
            Birth Certificate
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.photos_evidence} onChange={(e) => set("photos_evidence", e.target.checked)} />
            Photos Evidence
          </label>
        </div>
      </section>

      {/* ================= SEPARATION ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Separation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Separation Date" type="date" value={form.separation_date} onChange={(e) => set("separation_date", e.target.value)} />
          <Input label="Separated From Name" value={form.separated_from_name} onChange={(e) => set("separated_from_name", e.target.value)} />
          <Select label="Relationship to Child" value={form.relationship_to_child} onChange={(e) => set("relationship_to_child", e.target.value)} options={RELATIONSHIPS} />
          <Textarea label="Separation Address" value={form.separation_address} onChange={(e) => set("separation_address", e.target.value)} />
          <Textarea label="Separation Circumstances" value={form.separation_circumstances} onChange={(e) => set("separation_circumstances", e.target.value)} />
          <Textarea label="Main Cause of Separation" value={form.main_cause_of_separation} onChange={(e) => set("main_cause_of_separation", e.target.value)} />
        </div>
      </section>

      {/* ================= TRACED FAMILY ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Traced Family</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Traced Person Name" value={form.traced_person_name} onChange={(e) => set("traced_person_name", e.target.value)} />
          <Input label="Age" type="number" value={form.traced_person_age} onChange={(e) => set("traced_person_age", e.target.value)} />
          <Input label="Contact" value={form.traced_person_contact} onChange={(e) => set("traced_person_contact", e.target.value)} />
          <Input label="Gender" value={form.traced_person_gender} onChange={(e) => set("traced_person_gender", e.target.value)} />
          <Select label="Relationship" value={form.traced_person_relationship} onChange={(e) => set("traced_person_relationship", e.target.value)} options={RELATIONSHIPS} />
          <Input label="Occupation" value={form.traced_person_occupation} onChange={(e) => set("traced_person_occupation", e.target.value)} />
          <Input label="Signature Name" value={form.signature_name} onChange={(e) => set("signature_name", e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.wants_child || false} onChange={(e) => set("wants_child", e.target.checked)} />
            Wants Child
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.able_to_take_care || false} onChange={(e) => set("able_to_take_care", e.target.checked)} />
            Able to take care
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.alternative_family_available || false} onChange={(e) => set("alternative_family_available", e.target.checked)} />
            Alternative Family Available
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.agreement_take_child} onChange={(e) => set("agreement_take_child", e.target.checked)} />
            Agreement Take Child
          </label>
        </div>
      </section>

      {/* ================= DYNAMIC FAMILY MEMBERS ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-base-300 pb-2">
          <h3 className="text-sm font-semibold text-base-content/80">Family Members Listed</h3>
          <button type="button" onClick={addMember} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="size-3" /> Add Member
          </button>
        </div>
        {familyMembers.length === 0 && <p className="text-xs text-base-content/50 italic">No family members listed yet.</p>}
        {familyMembers.map((m, i) => (
          <div key={i} className="flex gap-3 items-end bg-base-200/50 p-3 rounded-lg">
            <div className="flex-1"><Input label="Name" value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} /></div>
            <div className="flex-1"><Select label="Relationship" value={m.relationship} onChange={(e) => updateMember(i, "relationship", e.target.value)} options={RELATIONSHIPS} /></div>
            <div className="flex-1"><Input label="Address" value={m.address} onChange={(e) => updateMember(i, "address", e.target.value)} /></div>
            <button type="button" onClick={() => removeMember(i)} className="p-2 text-error hover:bg-error/10 rounded-md mb-0.5">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </section>

      {/* ================= OBSERVATIONS & STAFF ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Observations & Staff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea label="Child Return Information" value={form.child_return_information} onChange={(e) => set("child_return_information", e.target.value)} />
          <Textarea label="Caseworker Observation" value={form.caseworker_observation} onChange={(e) => set("caseworker_observation", e.target.value)} />
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} />
          <Input label="Caseworker Date" type="date" value={form.caseworker_date} onChange={(e) => set("caseworker_date", e.target.value)} />
          <Input label="Organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} />
        </div>
      </section>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Tracing"}
        </button>
      </div>
    </form>
  );
}