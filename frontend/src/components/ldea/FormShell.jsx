// components/ldea/FormShell.MultiPersonPicker.jsx
// Shared page chrome for create/edit forms.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";
import { FormActions } from "./fields";

export function FormHeader({ backTo, backLabel, current, title, subtitle }) {
  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-base-content/60" aria-label="Breadcrumb">
        <Link to={backTo} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-base-200 hover:text-base-content">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
        <ChevronRight className="size-3.5 text-base-content/30" aria-hidden="true" />
        <span className="font-medium text-base-content">{current}</span>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-base-content/60">{subtitle}</p>}
    </div>
  );
}

export function FormErrorBanner({ formError, fieldErrors }) {
  const ref = useRef(null);
  const count = Object.keys(fieldErrors ?? {}).length;
  const visible = Boolean(formError) || count > 0;

  useEffect(() => {
    if (visible) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [visible, formError, fieldErrors]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{formError || "Some fields need your attention."}</p>
        {count > 0 && (
          <p className="mt-0.5 text-xs text-error/80">
            Fix the highlighted {count === 1 ? "field" : `${count} fields`} and save again.
          </p>
        )}
      </div>
    </div>
  );
}

export function StickyActions(props) {
  return (
    <div className="sticky bottom-4 z-10 rounded-2xl border border-base-300 bg-base-100/90 px-4 py-3 shadow-lg backdrop-blur">
      <FormActions {...props} />
    </div>
  );
}

export function FormSpinner() {
  return (
    <div className="grid place-items-center py-24">
      <span className="loading loading-spinner loading-md text-primary" aria-label="Loading" />
    </div>
  );
}