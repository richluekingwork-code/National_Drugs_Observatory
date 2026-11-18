import { Plus, Trash2 } from "lucide-react";

const RELATIONSHIPS = [
  { value: "mother",      label: "Mother" },
  { value: "father",      label: "Father" },
  { value: "grandparent", label: "Grandparent" },
  { value: "aunt_uncle",  label: "Aunt / Uncle" },
  { value: "sibling",     label: "Sibling" },
  { value: "cousin",      label: "Cousin" },
  { value: "other",       label: "Other" },
];

export function FamilyMembersEditor({ value = [], onChange, disabled }) {
  function update(i, patch) {
    onChange(value.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function remove(i) { onChange(value.filter((_, idx) => idx !== i)); }
  function add() {
    onChange([...value, { name: "", relationship: "other", address: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.map((m, i) => (
        <div key={i} className="grid gap-3 rounded-[--radius-field] border border-base-300 bg-base-100 p-3.5 sm:grid-cols-[1fr_10rem_1fr_auto]">
          <input
            type="text"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, { name: e.target.value })}
            disabled={disabled}
            className="input input-bordered h-10 text-sm"
            aria-label="Family member name"
          />
          <select
            value={m.relationship}
            onChange={(e) => update(i, { relationship: e.target.value })}
            disabled={disabled}
            className="select select-bordered h-10 text-sm"
            aria-label="Relationship"
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Address"
            value={m.address}
            onChange={(e) => update(i, { address: e.target.value })}
            disabled={disabled}
            className="input input-bordered h-10 text-sm"
            aria-label="Address"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            aria-label="Remove"
            className="btn btn-ghost btn-sm text-error"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} disabled={disabled} className="btn btn-ghost btn-sm normal-case">
        <Plus className="size-4" aria-hidden="true" />
        Add family member
      </button>
    </div>
  );
}