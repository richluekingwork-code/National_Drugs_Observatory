import { useState, useRef, useEffect } from "react";
import { mediaUrl } from "./Personavatar";
/* ------------------------------ Label ------------------------------ */

function FieldLabel({ label, required, htmlFor }) {
  return (
    <span className="label pb-1.5" htmlFor={htmlFor}>
      <span className="label-text text-[13px] font-medium text-base-content/75">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </span>
    </span>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-error" role="alert">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {error}
    </p>
  );
}

function FieldHint({ hint, error }) {
  if (!hint || error) return null;
  return <p className="mt-1.5 text-xs text-base-content/50">{hint}</p>;
}

const inputBase =
  "w-full text-sm transition-all duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary " +
  "placeholder:text-base-content/35";

const ICONS = {
  email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

function iconFor(name, type) {
  if (type === "email") return ICONS.email;
  if (type === "date") return null; // native date picker already has one
  if (name === "phone_number") return ICONS.phone;
  return null;
}

/* ------------------------------ Field ------------------------------ */

export function Field({ label, name, error, hint, required, type, ...rest }) {
  const icon = iconFor(name, type);
  return (
    <label className="flex w-full flex-col">
      <FieldLabel label={label} required={required} />
      <div className="relative">
        {icon && (
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
        <input
          name={name}
          type={type}
          required={required}
          aria-invalid={error ? "true" : undefined}
          className={
            `input input-bordered h-10 ${inputBase} ` +
            (icon ? "pl-9 " : "") +
            (error
              ? "input-error focus:ring-error/25 focus:border-error"
              : "hover:border-base-content/30")
          }
          {...rest}
        />
      </div>
      <FieldHint hint={hint} error={error} />
      <FieldError error={error} />
    </label>
  );
}

/* ---------------------------- SelectField ---------------------------- */

export function SelectField({ label, name, options, error, hint, required, placeholder = "Select…", ...rest }) {
  return (
    <label className="flex w-full flex-col">
      <FieldLabel label={label} required={required} />
      <select
        name={name}
        required={required}
        aria-invalid={error ? "true" : undefined}
        className={
              `select select-bordered h-10 ${inputBase} appearance-none bg-no-repeat ` +
              (rest.value === "" ? "text-base-content/40 " : "") +
              (error
                ? "select-error focus:ring-error/25 focus:border-error"
                : "hover:border-base-content/30")
            }
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.65rem center",
          backgroundSize: "1rem",
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FieldHint hint={hint} error={error} />
      <FieldError error={error} />
    </label>
  );
}

/* --------------------------- TextareaField --------------------------- */

export function TextareaField({ label, name, error, hint, required, rows = 3, ...rest }) {
  return (
    <label className="flex w-full flex-col">
      <FieldLabel label={label} required={required} />
      <textarea
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? "true" : undefined}
        className={
          `textarea textarea-bordered leading-relaxed ${inputBase} ` +
          (error
            ? "textarea-error focus:ring-error/25 focus:border-error"
            : "hover:border-base-content/30")
        }
        {...rest}
      />
      <FieldHint hint={hint} error={error} />
      <FieldError error={error} />
    </label>
  );
}

/* ----------------------------- PhotoField ----------------------------- */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // matches the "up to 5 MB" hint

export function PhotoField({ label, name, error, currentUrl, onChange }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  // Saved photos come back as relative paths ("/media/..."), which the browser
  // would load from the Vite dev server. mediaUrl() prefixes the API host.
  const image = preview || mediaUrl(currentUrl);
  const shownError = localError || error;

  // Free the blob URL when it is replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file (PNG or JPG).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setLocalError("That image is larger than 5 MB.");
      return;
    }

    setLocalError(null);
    onChange?.(file);
    setPreview(URL.createObjectURL(file));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  function clear(e) {
    e.stopPropagation();
    setPreview(null);
    setLocalError(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div className="flex w-full flex-col">
      <FieldLabel label={label} />

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={
          "group relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all " +
          (dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : shownError
              ? "border-error/50 bg-error/5 hover:border-error"
              : "border-base-300 bg-base-200/30 hover:border-primary/50 hover:bg-primary/5")
        }
      >
        {image ? (
          <div className="relative shrink-0">
            <img
              src={image}
              alt="Portrait preview"
              className="size-16 rounded-xl border border-base-300 object-cover shadow-sm"
            />
            {preview && (
              <button
                type="button"
                onClick={clear}
                aria-label="Remove new photo"
                className="absolute -top-1.5 -right-1.5 btn btn-xs btn-circle btn-error shadow"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-base-300/50 text-base-content/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium">
            {preview ? "New photo selected" : image ? "Replace photo" : "Upload a portrait"}
          </p>
          <p className="mt-0.5 text-xs text-base-content/50">
            Drag & drop or <span className="text-primary font-medium">browse</span> — PNG, JPG up to 5 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          name={name}
          className="hidden"
          // stop the synthetic click from bubbling back into the wrapper
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      <FieldError error={shownError} />
    </div>
  );
}


/* ---------------------------- FormSection ---------------------------- */

export function FormSection({ title, description, children }) {
  return (
    <section className="card bg-base-100 border border-base-300/70 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body gap-5 p-5 sm:p-6">
        <div className="pb-3.5 border-b border-base-300/60">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-base-content/55">{description}</p>
          )}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}

/* ---------------------------- FormActions ---------------------------- */

export function FormActions({ submitting, onCancel, submitLabel = "Save" }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-ghost btn-sm rounded-lg"
        disabled={submitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary btn-sm rounded-lg px-5 shadow-sm shadow-primary/30"
      >
        {submitting && <span className="loading loading-spinner loading-xs" />}
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
