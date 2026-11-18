import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { accountService } from "../../services/accountService";
import { parseError } from "./useSaveForm";
import { FormFooter, Section, TextField } from "./formKit";

const EMPTY = { current_password: "", new_password: "", confirm_password: "" };
const SERVER_FIELDS = ["current_password", "new_password"];

// Client-side hint only. The backend validators decide what is accepted.
function strengthOf(pw) {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  let score = 1;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH = [
  null,
  { label: "Weak", bar: "bg-error", text: "text-error" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-info", text: "text-info" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
];

export default function PasswordForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const mismatch =
    form.confirm_password.length > 0 && form.confirm_password !== form.new_password;
  const matches =
    form.confirm_password.length > 0 && form.confirm_password === form.new_password;
  const ready =
    form.current_password && form.new_password && form.confirm_password && !mismatch;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setMessage(null);
    setError(null);
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting || !ready) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      await accountService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setForm(EMPTY);
      setMessage("Password changed. Other devices have been signed out.");
    } catch (err) {
      const parsed = parseError(err, SERVER_FIELDS);
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.general);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      <Section
        title="Change password"
        description="Choose a password you don't use anywhere else. Changing it signs you out on your other devices."
      >
        <PasswordField
          label="Current password"
          name="current_password"
          autoComplete="current-password"
          value={form.current_password}
          onChange={onChange}
          error={fieldErrors.current_password}
        />

        <div className="space-y-2">
          <PasswordField
            label="New password"
            name="new_password"
            autoComplete="new-password"
            value={form.new_password}
            onChange={onChange}
            error={fieldErrors.new_password}
          />
          <StrengthMeter password={form.new_password} />
        </div>

        <div className="space-y-2">
          <PasswordField
            label="Confirm new password"
            name="confirm_password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={onChange}
            error={mismatch ? "Passwords don't match." : undefined}
          />
          {matches && (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <Check className="size-3.5" aria-hidden="true" />
              Passwords match
            </p>
          )}
        </div>
      </Section>

      <FormFooter
        submitting={submitting}
        message={message}
        error={error}
        canSave={!!ready}
      />
    </form>
  );
}

function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="btn btn-ghost btn-square btn-sm text-base-content/50 hover:text-base-content"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}

function StrengthMeter({ password }) {
  const level = strengthOf(password);
  if (!level) return null;
  const { label, bar, text } = STRENGTH[level];

  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i <= level ? bar : "bg-base-300"
            }`}
          />
        ))}
      </div>
      <p className={`w-14 text-right text-xs font-medium ${text}`}>
        <span className="sr-only">Password strength: </span>
        {label}
      </p>
    </div>
  );
}