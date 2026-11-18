 import { useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/* ───────────────────────── Layout ───────────────────────── */

export function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10">
      <header>
        <h3 className="text-sm font-semibold text-base-content">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-base-content/60">
          {description}
        </p>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/* ───────────────────────── Controls ───────────────────────── */

const controlBase =
  "w-full rounded-[--radius-field] border bg-base-100 text-sm text-base-content " +
  "placeholder:text-base-content/40 transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 ";

const controlState = (error) =>
  error
    ? "border-error focus:border-error focus:ring-error/25"
    : "border-base-300 hover:border-base-content/30 focus:border-primary focus:ring-primary/25";

export function FieldShell({ id, label, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-base-content/80"
      >
        {label}
        {hint && (
          <span className="text-xs font-normal text-base-content/50">{hint}</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, name, hint, error, icon, type = "text", ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base-content/40">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${controlBase}${controlState(error)} h-10 ${icon ? "pl-10" : "pl-3"} pr-3`}
          {...props}
        />
      </div>
    </FieldShell>
  );
}

export function TextArea({ label, name, hint, error, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${controlBase}${controlState(error)} resize-y px-3 py-2.5 leading-relaxed`}
        {...props}
      />
    </FieldShell>
  );
}

/* ───────────────────────── Footer ───────────────────────── */

function StatusLine({ dirty, message, error }) {
  let content = null;

  if (error) {
    content = (
      <span className="flex items-center gap-2 text-error">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </span>
    );
  } else if (message) {
    content = (
      <span className="flex items-center gap-2 text-success">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        {message}
      </span>
    );
  } else if (dirty) {
    content = (
      <span className="flex items-center gap-2 text-base-content/70">
        <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
        You have unsaved changes
      </span>
    );
  }

  return (
    <p className="min-h-5 text-sm" role="status" aria-live="polite">
      {content}
    </p>
  );
}

/**
 * `dirty` and `onDiscard` are optional so existing forms that only pass
 * { submitting, message, error } keep working: Save stays enabled and
 * the Discard button is hidden.
 */
export function FormFooter({ submitting, message, error, dirty, onDiscard }) {
  const canSave = dirty !== false;

  return (
    <div className="flex flex-col-reverse gap-4 border-t border-base-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <StatusLine dirty={dirty === true} message={message} error={error} />

      <div className="flex items-center gap-2 sm:justify-end">
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={!dirty || submitting}
            className="btn btn-ghost h-10 px-4 text-sm normal-case"
          >
            Discard
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !canSave}
          className="btn btn-primary h-10 min-w-32 px-5 text-sm normal-case"
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Saving" : "Save changes"}
        </button>
      </div>
    </div>
  );
}