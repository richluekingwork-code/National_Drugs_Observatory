import { Plus, Trash2 } from "lucide-react";

export function TracingActionRowsEditor({ value = [], onChange, disabled }) {
  function update(i, patch) {
    onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function remove(i) { onChange(value.filter((_, idx) => idx !== i)); }
  function add() {
    onChange([...value, {
      action_taken: "", provider_details: "", individual_traced: "",
      tracing_location: "", tracing_outcome: "", tracing_details: "",
      next_steps: "", due_date: "",
    }]);
  }

  return (
    <div className="space-y-3">
      {value.map((a, i) => (
        <div key={i} className="rounded-[--radius-field] border border-base-300 bg-base-100 p-3.5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input input-bordered h-10 text-sm"
              placeholder="Action taken"
              value={a.action_taken}
              onChange={(e) => update(i, { action_taken: e.target.value })}
              disabled={disabled}
            />
            <input
              className="input input-bordered h-10 text-sm"
              placeholder="Provider details"
              value={a.provider_details}
              onChange={(e) => update(i, { provider_details: e.target.value })}
              disabled={disabled}
            />
            <input
              className="input input-bordered h-10 text-sm"
              placeholder="Individual traced"
              value={a.individual_traced}
              onChange={(e) => update(i, { individual_traced: e.target.value })}
              disabled={disabled}
            />
            <input
              className="input input-bordered h-10 text-sm"
              placeholder="Outcome"
              value={a.tracing_outcome}
              onChange={(e) => update(i, { tracing_outcome: e.target.value })}
              disabled={disabled}
            />
          </div>
          <textarea
            className="textarea textarea-bordered w-full text-sm"
            rows={2}
            placeholder="Tracing location / details"
            value={a.tracing_location}
            onChange={(e) => update(i, { tracing_location: e.target.value })}
            disabled={disabled}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input input-bordered h-10 text-sm"
              placeholder="Next steps"
              value={a.next_steps}
              onChange={(e) => update(i, { next_steps: e.target.value })}
              disabled={disabled}
            />
            <input
              type="date"
              className="input input-bordered h-10 text-sm"
              value={a.due_date ?? ""}
              onChange={(e) => update(i, { due_date: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => remove(i)} disabled={disabled} className="btn btn-ghost btn-xs text-error normal-case">
              <Trash2 className="size-3.5" aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} disabled={disabled} className="btn btn-ghost btn-sm normal-case">
        <Plus className="size-4" aria-hidden="true" /> Add action
      </button>
    </div>
  );
}