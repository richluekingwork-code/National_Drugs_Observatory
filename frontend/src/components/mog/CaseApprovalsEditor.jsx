import { Plus, Trash2 } from "lucide-react";

const ROLES = [
  { value: "child",      label: "Child" },
  { value: "caregiver",  label: "Caregiver" },
  { value: "caseworker", label: "Caseworker" },
  { value: "supervisor", label: "Supervisor" },
];

export function CaseApprovalsEditor({ value = [], onChange, disabled, error }) {
  function update(i, patch) {
    onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function remove(i) { onChange(value.filter((_, idx) => idx !== i)); }
  function add() {
    onChange([...value, { role: "caseworker", name: "", agency: "", contact_details: "", signature: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.map((a, i) => (
        <div key={i} className="grid gap-3 rounded-[--radius-field] border border-base-300 bg-base-100 p-3.5 sm:grid-cols-[9rem_1fr_1fr_auto]">
          <select
            value={a.role}
            onChange={(e) => update(i, { role: e.target.value })}
            disabled={disabled}
            className="select select-bordered h-10 text-sm"
            aria-label="Role"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input
            className="input input-bordered h-10 text-sm"
            placeholder="Name"
            value={a.name}
            onChange={(e) => update(i, { name: e.target.value })}
            disabled={disabled}
          />
          <input
            className="input input-bordered h-10 text-sm"
            placeholder="Agency"
            value={a.agency}
            onChange={(e) => update(i, { agency: e.target.value })}
            disabled={disabled}
          />
          <button type="button" onClick={() => remove(i)} disabled={disabled} aria-label="Remove" className="btn btn-ghost btn-sm text-error">
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} disabled={disabled} className="btn btn-ghost btn-sm normal-case">
        <Plus className="size-4" aria-hidden="true" /> Add approval
      </button>
      {error && <p className="text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}