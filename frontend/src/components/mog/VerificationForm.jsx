// frontend/src/components/mog/VerificationForm.jsx
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

const TriStateSelect = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">{label}</span>
    <select
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none bg-base-100"
      value={value === null ? "" : value}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === "" ? null : val === "true");
      }}
    >
      <option value="">— Unknown —</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
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

export default function VerificationForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth();

  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTIES;
    const normalizedAssigned = assigned.map(c => typeof c === 'string' ? c.toLowerCase() : c);
    return COUNTIES.filter((c) => normalizedAssigned.includes(c.value.toLowerCase()));
  }, [currentMembership]);

  const [form, setForm] = useState({
    person_id: initial?.person_id || "",
    child_code: initial?.child_code || "",
    case_id_number: initial?.case_id_number || "",
    follow_county: initial?.follow_county || "",
    date_completed: initial?.date_completed || new Date().toISOString().split("T")[0],
    
    current_address: initial?.current_address || "",
    caregiver_name: initial?.caregiver_name || "",
    
    before_separation_address: initial?.before_separation_address || "",
    street: initial?.street || "",
    town: initial?.town || "",
    district: initial?.district || "",
    county: initial?.county || "",
    country: initial?.country || "Liberia",
    other_address_info: initial?.other_address_info || "",
    
    match_case: initial?.match_case ?? null,
    discrepancies: initial?.discrepancies || "",
    child_knows_adult: initial?.child_knows_adult ?? null,
    child_comments: initial?.child_comments || "",
    recognize_photos: initial?.recognize_photos ?? null,
    
    need_info: initial?.need_info ?? null,
    info_provided: initial?.info_provided ?? null,
    wants_reunification: initial?.wants_reunification ?? null,
    child_wishes_comments: initial?.child_wishes_comments || "",
    
    recommendation: initial?.recommendation || "",
    recommendation_reason: initial?.recommendation_reason || "",
    
    caseworker_name: initial?.caseworker_name || "",
    caseworker_date: initial?.caseworker_date || new Date().toISOString().split("T")[0],
    organization: initial?.organization || "",
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
      const dateFields = ["date_completed", "caseworker_date"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (isEditing) {
        await mogService.verifications.update(initial.id, payload);
      } else {
        await mogService.verifications.create(payload);
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
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Child Code" value={form.child_code} onChange={(e) => set("child_code", e.target.value)} />
          <Input label="Case ID Number" value={form.case_id_number} onChange={(e) => set("case_id_number", e.target.value)} />
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
          <Input label="Date Completed" type="date" value={form.date_completed} onChange={(e) => set("date_completed", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Address & Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Current Address" value={form.current_address} onChange={(e) => set("current_address", e.target.value)} />
          <Input label="Caregiver Name" value={form.caregiver_name} onChange={(e) => set("caregiver_name", e.target.value)} />
          <Input label="Before Separation Address" value={form.before_separation_address} onChange={(e) => set("before_separation_address", e.target.value)} />
          <Input label="Street" value={form.street} onChange={(e) => set("street", e.target.value)} />
          <Input label="Town" value={form.town} onChange={(e) => set("town", e.target.value)} />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={COUNTIES} />
          <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Input label="Other Address Info" value={form.other_address_info} onChange={(e) => set("other_address_info", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Verification Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TriStateSelect label="Match Case" value={form.match_case} onChange={(v) => set("match_case", v)} />
          <TriStateSelect label="Child Knows Adult" value={form.child_knows_adult} onChange={(v) => set("child_knows_adult", v)} />
          <TriStateSelect label="Recognize Photos" value={form.recognize_photos} onChange={(v) => set("recognize_photos", v)} />
          <Textarea label="Discrepancies" value={form.discrepancies} onChange={(e) => set("discrepancies", e.target.value)} />
          <Textarea label="Child Comments" value={form.child_comments} onChange={(e) => set("child_comments", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Wishes & Recommendation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TriStateSelect label="Need Info" value={form.need_info} onChange={(v) => set("need_info", v)} />
          <TriStateSelect label="Info Provided" value={form.info_provided} onChange={(v) => set("info_provided", v)} />
          <TriStateSelect label="Wants Reunification" value={form.wants_reunification} onChange={(v) => set("wants_reunification", v)} />
          <Textarea label="Child Wishes Comments" value={form.child_wishes_comments} onChange={(e) => set("child_wishes_comments", e.target.value)} />
          
          <Input label="Recommendation" value={form.recommendation} onChange={(e) => set("recommendation", e.target.value)} />
          <Textarea label="Recommendation Reason" value={form.recommendation_reason} onChange={(e) => set("recommendation_reason", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Caseworker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} />
          <Input label="Date" type="date" value={form.caseworker_date} onChange={(e) => set("caseworker_date", e.target.value)} />
          <Input label="Organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Verification"}
        </button>
      </div>
    </form>
  );
}