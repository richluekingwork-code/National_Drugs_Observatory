import { useRef, useState, useId } from "react";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import PasswordField from "./PasswordField";
import { useAuth } from "../../contexts/AuthContext";

const FIELD_REQUIRED = "This field is required.";

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);
  const identifierId = useId();

  function validate() {
    const errs = {};
    if (!identifier.trim()) errs.identifier = FIELD_REQUIRED;
    if (!password) errs.password = FIELD_REQUIRED;
    return errs;
  }

  function focusFirstInvalid(errs) {
    if (errs.identifier) identifierRef.current?.focus();
    else if (errs.password) passwordRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstInvalid(errs);
      return;
    }

    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
      setPassword(""); // clear sensitive value on success
      onSuccess?.();
    } catch (err) {
      setPassword(""); // clear on failure too — reduces shoulder-surf risk
      setFormError(err?.message ?? "Unable to sign in.");
      // Announce via live region; move focus there so SRs read it.
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-3 text-sm text-error focus:outline-none"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <div className="form-control w-full">
        <label htmlFor={identifierId} className="label pb-1.5">
          <span className="label-text text-sm font-medium text-base-content/80">
            Username or email
          </span>
        </label>
        <input
          id={identifierId}
          ref={identifierRef}
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={fieldErrors.identifier ? "true" : undefined}
          aria-describedby={
            fieldErrors.identifier ? `${identifierId}-error` : undefined
          }
          disabled={submitting}
          className={[
            "input input-bordered w-full h-11 text-base transition-colors",
            fieldErrors.identifier ? "input-error" : "",
          ].join(" ")}
        />
        {fieldErrors.identifier && (
          <p
            id={`${identifierId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-error"
          >
            {fieldErrors.identifier}
          </p>
        )}
      </div>

      <PasswordField
        ref={passwordRef}
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        disabled={submitting}
      />

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary h-11 w-full text-sm font-medium normal-case shadow-sm hover:shadow disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Signing in&hellip;</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-base-content/60">
        Need access? Contact your institution administrator.
      </p>
    </form>
  );
}