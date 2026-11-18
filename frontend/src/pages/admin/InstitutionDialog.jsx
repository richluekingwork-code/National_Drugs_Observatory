import { useEffect, useId, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminService } from "../../services/adminService";

export const INSTITUTION_CHOICES = [
  { value: "MOJ",  label: "Ministry of Justice" },
  { value: "LDEA", label: "Liberia Drug Enforcement Agency" },
  { value: "MOH",  label: "Ministry of Health" },
  { value: "MOG",  label: "Ministry of Gender" },
  { value: "MOYS", label: "Ministry of Youth and Sports" },
];

export function labelOf(code) {
  return INSTITUTION_CHOICES.find((c) => c.value === code)?.label ?? code;
}

export default function InstitutionDialog({
  institution,
  existingCodes = [],
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(institution?.id);
  const available = INSTITUTION_CHOICES.filter(
    (c) => !existingCodes.includes(c.value) || c.value === institution?.code,
  );

  const [form, setForm] = useState({
    code: institution?.code ?? (available[0]?.value ?? ""),
    description: institution?.description ?? "",
    is_active: institution?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.querySelector("select, input, button")?.focus();
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      if (isEdit) {
        await adminService.updateInstitution(institution.id, {
          description: form.description,
          is_active: form.is_active,
        });
      } else {
        await adminService.createInstitution({
          code: form.code,
          description: form.description,
          is_active: form.is_active,
        });
      }
      onSaved?.();
    } catch (err) {
      const body = err?.response?.data;
      if (body && typeof body === "object") {
        const fields = {};
        let nonField = null;
        for (const [k, v] of Object.entries(body)) {
          const msg = Array.isArray(v) ? v[0] : String(v);
          if (k === "non_field_errors" || k === "detail") nonField = msg;
          else fields[k] = msg;
        }
        setFieldErrors(fields);
        setFormError(
          nonField ||
          (Object.keys(fields).length === 0
            ? "Could not save institution."
            : null),
        );
      } else {
        setFormError("Could not save institution.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-[--radius-box] border border-base-300 bg-base-100 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              {isEdit ? "Edit institution" : "New institution"}
            </h2>
            <p className="mt-0.5 text-xs text-base-content/60">
              {isEdit
                ? "The code cannot be changed after creation."
                : "Choose one of the five partner agencies."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-ghost btn-xs"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {formError && (
            <div role="alert" className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
              {formError}
            </div>
          )}

          <label className="form-control w-full">
            <span className="label pb-1.5">
              <span className="label-text text-sm font-medium text-base-content/80">
                Institution {!isEdit && <span className="text-error">*</span>}
              </span>
            </span>
            <select
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              disabled={isEdit || submitting}
              required
              className={"select select-bordered h-10 w-full text-sm " + (fieldErrors.code ? "select-error" : "")}
            >
              <option value="">Select institution</option>
              {(isEdit ? INSTITUTION_CHOICES : available).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value} — {c.label}
                </option>
              ))}
            </select>
            {fieldErrors.code && (
              <p className="mt-1.5 text-xs text-error" role="alert">{fieldErrors.code}</p>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label pb-1.5">
              <span className="label-text text-sm font-medium text-base-content/80">Description</span>
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              disabled={submitting}
              className="textarea textarea-bordered w-full text-sm"
              placeholder="Optional description"
            />
          </label>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              disabled={submitting}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <span className="text-sm font-medium">Active</span>
          </label>

          <footer className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-ghost btn-sm normal-case">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!isEdit && !form.code)}
              className="btn btn-primary btn-sm normal-case"
            >
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create institution"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}