// frontend/src/components/mog/CaseClosureForm.jsx
import { useState, useMemo } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

const STORAGE_CHOICES = [
  { value: "electronic", label: "Electronic" },
  { value: "hardcopy", label: "Hard Copy" },
  { value: "both", label: "Both" },
];

const APPROVAL_ROLES = [
  { value: "child", label: "Child" },
  { value: "caregiver", label: "Caregiver" },
  { value: "caseworker", label: "Caseworker" },
  { value: "supervisor", label: "Supervisor" },
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

export default function CaseClosureForm({ initial, onSaved, onCancel }) {
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
    follow_county: initial?.follow_county || "",
    case_id_number: initial?.case_id_number || "",
    date_case_closed: initial?.date_case_closed || new Date().toISOString().split("T")[0],
    primary_reason: initial?.primary_reason || "",
    closure_reason_details: initial?.closure_reason_details || "",
    case_opened_weeks: initial?.case_opened_weeks || "",
    current_case_summary: initial?.current_case_summary || "",
    
    caregiver_name: initial?.caregiver_name || "",
    caregiver_relationship: initial?.caregiver_relationship || "",
    county: initial?.county || "",
    district: initial?.district || "",
    community: initial?.community || "",
    street: initial?.street || "",
    caregiver_phone: initial?.caregiver_phone || "",
    
    closure_process: initial?.closure_process || "",
    child_agreed: initial?.child_agreed || false,
    child_reason: initial?.child_reason || "",
    caregiver_agreed: initial?.caregiver_agreed || false,
    caregiver_reason: initial?.caregiver_reason || "",
    
    followup_planned: initial?.followup_planned || false,
    followup_reason: initial?.followup_reason || "",
    file_complete: initial?.file_complete || false,
    file_complete_reason: initial?.file_complete_reason || "",
    
    storage_method: initial?.storage_method || "electronic",
    file_storage_until: initial?.file_storage_until || "",
    child_informed: initial?.child_informed || false,
    child_informed_reason: initial?.child_informed_reason || "",
    
    contact_person_details: initial?.contact_person_details || "",
    caseworker_name: initial?.caseworker_name || "",
    caseworker_phone: initial?.caseworker_phone || "",
    caseworker_signature: initial?.caseworker_signature || "",
  });

  const [approvals, setApprovals] = useState(initial?.approvals || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addApproval = () => setApprovals([...approvals, { 
    role: "", name: "", agency: "", contact_details: "", signature: "" 
  }]);

  const updateApproval = (i, k, v) => {
    const next = [...approvals];
    next[i][k] = v;
    setApprovals(next);
  };

  const removeApproval = (i) => setApprovals(approvals.filter((_, idx) => idx !== i));

  useEffect(() => {
      if (!isEditing && countyOptions.length === 1) {
        setForm((f) =>
          f.county ? f : { ...f, county: countyOptions[0].value }  // follow_county for Outreach
        );
      }
    }, [countyOptions, isEditing]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form, approvals: approvals };
      const dateFields = ["date_case_closed", "file_storage_until"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (!payload.case_opened_weeks) payload.case_opened_weeks = null;

      if (isEditing) {
        await mogService.caseClosures.update(initial.id, payload);
      } else {
        await mogService.caseClosures.create(payload);
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
          <Input label="Case ID Number" value={form.case_id_number} onChange={(e) => set("case_id_number", e.target.value)} required />
          <Input label="Date Case Closed" type="date" value={form.date_case_closed} onChange={(e) => set("date_case_closed", e.target.value)} required />
          <Input label="Primary Reason" value={form.primary_reason} onChange={(e) => set("primary_reason", e.target.value)} required />
          <Input label="Case Opened Weeks" type="number" value={form.case_opened_weeks} onChange={(e) => set("case_opened_weeks", e.target.value)} />
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Closure Reason Details" value={form.closure_reason_details} onChange={(e) => set("closure_reason_details", e.target.value)} />
          <Textarea label="Current Case Summary" value={form.current_case_summary} onChange={(e) => set("current_case_summary", e.target.value)} required />
          <Textarea label="Closure Process" value={form.closure_process} onChange={(e) => set("closure_process", e.target.value)} required />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Caregiver & Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Caregiver Name" value={form.caregiver_name} onChange={(e) => set("caregiver_name", e.target.value)} />
          <Select label="Relationship" value={form.caregiver_relationship} onChange={(e) => set("caregiver_relationship", e.target.value)} options={RELATIONSHIPS} />
          <Input label="Caregiver Phone" value={form.caregiver_phone} onChange={(e) => set("caregiver_phone", e.target.value)} />
          <Select label="County" value={form.county} onChange={(e) => set("county", e.target.value)} options={COUNTIES} />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          <Input label="Community" value={form.community} onChange={(e) => set("community", e.target.value)} />
          <Input label="Street" value={form.street} onChange={(e) => set("street", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Agreements & File Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.child_agreed} onChange={(e) => set("child_agreed", e.target.checked)} />
              Child Agreed to Closure
            </label>
            <Input label="Child Reason" value={form.child_reason} onChange={(e) => set("child_reason", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.caregiver_agreed} onChange={(e) => set("caregiver_agreed", e.target.checked)} />
              Caregiver Agreed to Closure
            </label>
            <Input label="Caregiver Reason" value={form.caregiver_reason} onChange={(e) => set("caregiver_reason", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.followup_planned} onChange={(e) => set("followup_planned", e.target.checked)} />
              Follow-up Planned
            </label>
            <Input label="Follow-up Reason" value={form.followup_reason} onChange={(e) => set("followup_reason", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.file_complete} onChange={(e) => set("file_complete", e.target.checked)} />
              File Complete
            </label>
            <Input label="File Complete Reason" value={form.file_complete_reason} onChange={(e) => set("file_complete_reason", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={form.child_informed} onChange={(e) => set("child_informed", e.target.checked)} />
              Child Informed of Closure
            </label>
            <Input label="Child Informed Reason" value={form.child_informed_reason} onChange={(e) => set("child_informed_reason", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Select label="Storage Method" value={form.storage_method} onChange={(e) => set("storage_method", e.target.value)} options={STORAGE_CHOICES} />
            <Input label="File Storage Until" type="date" value={form.file_storage_until} onChange={(e) => set("file_storage_until", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Contact Person Details" value={form.contact_person_details} onChange={(e) => set("contact_person_details", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Caseworker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} required />
          <Input label="Caseworker Phone" value={form.caseworker_phone} onChange={(e) => set("caseworker_phone", e.target.value)} />
          <Input label="Caseworker Signature" value={form.caseworker_signature} onChange={(e) => set("caseworker_signature", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-base-300 pb-2">
          <h3 className="text-sm font-semibold text-base-content/80">Closure Approvals</h3>
          <button type="button" onClick={addApproval} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="size-3" /> Add Approval
          </button>
        </div>
        {approvals.length === 0 && <p className="text-xs text-base-content/50 italic">No approvals listed yet.</p>}
        
        {approvals.map((a, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-3 items-end bg-base-200/50 p-3 rounded-lg border border-base-300 relative">
            <button type="button" onClick={() => removeApproval(i)} className="absolute top-2 right-2 p-1.5 text-error hover:bg-error/10 rounded-md md:hidden">
              <Trash2 className="size-4" />
            </button>
            <div className="w-full md:w-1/4">
              <Select label="Role" value={a.role} onChange={(e) => updateApproval(i, "role", e.target.value)} options={APPROVAL_ROLES} />
            </div>
            <div className="w-full md:w-1/4">
              <Input label="Name" value={a.name} onChange={(e) => updateApproval(i, "name", e.target.value)} />
            </div>
            <div className="w-full md:w-1/4">
              <Input label="Agency" value={a.agency} onChange={(e) => updateApproval(i, "agency", e.target.value)} />
            </div>
            <div className="w-full md:w-1/4">
              <Input label="Signature" value={a.signature} onChange={(e) => updateApproval(i, "signature", e.target.value)} />
            </div>
            <button type="button" onClick={() => removeApproval(i)} className="hidden md:block p-2 text-error hover:bg-error/10 rounded-md mb-0.5">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Case Closure"}
        </button>
      </div>
    </form>
  );
}