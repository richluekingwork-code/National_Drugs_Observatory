import { PersonPicker } from "../ldea/PersonPicker";

const INPUT_CLS = (err) =>
  "input input-bordered h-10 w-full text-sm " + (err ? "input-error" : "");

export function SchemaForm({ sections, values, errors = {}, onChange, disabled }) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5 sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold">{section.title}</h2>
            {section.description && (
              <p className="mt-0.5 text-xs text-base-content/60">{section.description}</p>
            )}
          </div>
          <div className="space-y-4">
            <Fields rows={section.fields} values={values} errors={errors} onChange={onChange} disabled={disabled} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Fields({ rows, values, errors, onChange, disabled }) {
  return (
    <>
      {rows.map((row) => {
        // row: { fields: [...] } for grid, or a bare field for full-width
        const items = row.fields ?? [row];
        const grid = items.length > 1 ? `sm:grid-cols-${items.length}` : "";
        return (
          <div key={row.name ?? items.map((f) => f.name).join("-")} className={`grid gap-4 ${grid}`}>
            {items.map((f) => (
              <Field
                key={f.name}
                spec={f}
                value={values[f.name]}
                error={errors[f.name]}
                onChange={onChange}
                disabled={disabled}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

function Field({ spec, value, error, onChange, disabled }) {
  const { name, label, type = "text", hint, options, required, ...rest } = spec;

  if (type === "person") {
    return (
      <PersonPicker
        lookup={spec.lookup}
        value={value ?? ""}
        onChange={(id) => onChange(name, id)}
        error={error}
        required={required}
        role={spec.role}
      />
    );
  }

  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2.5 pt-6">
        <input
          type="checkbox"
          name={name}
          checked={Boolean(value)}
          onChange={(e) => onChange(name, e.target.checked)}
          disabled={disabled}
          className="checkbox checkbox-sm"
        />
        <span className="text-sm">{label}</span>
        {error && <span className="ml-2 text-xs text-error" role="alert">{error}</span>}
      </label>
    );
  }

  if (type === "select") {
    return (
      <label className="form-control w-full">
        <span className="label pb-1.5">
          <span className="label-text text-sm font-medium text-base-content/80">
            {label}{required && <span className="text-error"> *</span>}
          </span>
        </span>
        <select
          name={name}
          value={value ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
          className={"select select-bordered h-10 w-full text-sm " + (error ? "select-error" : "")}
          {...rest}
        >
          <option value="">{spec.placeholder ?? "Select…"}</option>
          {(options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="form-control w-full">
        <span className="label pb-1.5">
          <span className="label-text text-sm font-medium text-base-content/80">
            {label}{required && <span className="text-error"> *</span>}
          </span>
        </span>
        <textarea
          name={name}
          value={value ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
          rows={spec.rows ?? 3}
          className={"textarea textarea-bordered w-full text-sm " + (error ? "textarea-error" : "")}
        />
        {hint && !error && <p className="mt-1 text-xs text-base-content/50">{hint}</p>}
        {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
      </label>
    );
  }

  return (
    <label className="form-control w-full">
      <span className="label pb-1.5">
        <span className="label-text text-sm font-medium text-base-content/80">
          {label}{required && <span className="text-error"> *</span>}
        </span>
      </span>
      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        className={INPUT_CLS(error)}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-base-content/50">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
    </label>
  );
}