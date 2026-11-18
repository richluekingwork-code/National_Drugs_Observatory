// frontend/src/components/mog/TracingActionForm.jsx
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

export default function TracingActionForm({ initial, onSaved, onCancel }) {
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
    tracing_notes: initial?.tracing_notes || "",
    caseworker_name: initial?.caseworker_name || "",
    caseworker_date: initial?.caseworker_date || new Date().toISOString().split("T")[0],
    caseworker_signature: initial?.caseworker_signature || "",
  });

  const [actions, setActions] = useState(initial?.actions || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addAction = () => setActions([...actions, { 
    action_taken: "", provider_details: "", individual_traced: "", 
    tracing_location: "", tracing_outcome: "", tracing_details: "", 
    next_steps: "", due_date: "" 
  }]);

  const updateAction = (i, k, v) => {
    const next = [...actions];
    next[i][k] = v;
    setActions(next);
  };

  const removeAction = (i) => setActions(actions.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form, actions: actions };
      if (!payload.caseworker_date) payload.caseworker_date = null;
      
      payload.actions = payload.actions.map(a => ({
        ...a,
        due_date: a.due_date ? a.due_date : null
      }));

      if (isEditing) {
        await mogService.tracingActions.update(initial.id, payload);
      } else {
        await mogService.tracingActions.create(payload);
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
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
          <Input label="Caseworker Name" value={form.caseworker_name} onChange={(e) => set("caseworker_name", e.target.value)} required />
          <Input label="Caseworker Date" type="date" value={form.caseworker_date} onChange={(e) => set("caseworker_date", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Tracing Notes (Overall)" value={form.tracing_notes} onChange={(e) => set("tracing_notes", e.target.value)} rows={3} required />
          <Input label="Caseworker Signature" value={form.caseworker_signature} onChange={(e) => set("caseworker_signature", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-base-300 pb-2">
          <h3 className="text-sm font-semibold text-base-content/80">Individual Actions Taken</h3>
          <button type="button" onClick={addAction} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="size-3" /> Add Action
          </button>
        </div>
        
        {actions.length === 0 && <p className="text-xs text-base-content/50 italic">No individual actions listed yet.</p>}
        
        {actions.map((a, i) => (
          <div key={i} className="bg-base-200/50 p-4 rounded-lg space-y-4 border border-base-300 relative">
            <button type="button" onClick={() => removeAction(i)} className="absolute top-2 right-2 p-1.5 text-error hover:bg-error/10 rounded-md" title="Remove Action">
              <Trash2 className="size-4" />
            </button>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">Action #{i + 1}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Action Taken" value={a.action_taken} onChange={(e) => updateAction(i, "action_taken", e.target.value)} />
              <Input label="Provider Details" value={a.provider_details} onChange={(e) => updateAction(i, "provider_details", e.target.value)} />
              <Input label="Individual Traced" value={a.individual_traced} onChange={(e) => updateAction(i, "individual_traced", e.target.value)} />
              <Input label="Tracing Location" value={a.tracing_location} onChange={(e) => updateAction(i, "tracing_location", e.target.value)} />
              <Input label="Tracing Outcome" value={a.tracing_outcome} onChange={(e) => updateAction(i, "tracing_outcome", e.target.value)} />
              <Input label="Due Date" type="date" value={a.due_date} onChange={(e) => updateAction(i, "due_date", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Textarea label="Tracing Details" value={a.tracing_details} onChange={(e) => updateAction(i, "tracing_details", e.target.value)} />
              <Textarea label="Next Steps" value={a.next_steps} onChange={(e) => updateAction(i, "next_steps", e.target.value)} />
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Tracing Actions"}
        </button>
      </div>
    </form>
  );
}