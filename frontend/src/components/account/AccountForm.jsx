import { accountService } from "../../services/accountService";
import { useSaveForm } from "./useSaveForm";
import { FormFooter, Section, TextField } from "./formKit";

// Backwards-compatible exports for forms that still import these from here
// (e.g. a change-password form). Point them at "./formKit" and delete these
// two lines when convenient.
export { TextField as Field, FormFooter };

const FIELDS = ["first_name", "middle_name", "last_name", "email"];

const toForm = (user) => ({
  first_name: user?.first_name ?? "",
  middle_name: user?.middle_name ?? "",
  last_name: user?.last_name ?? "",
  email: user?.email ?? "",
});

export default function AccountForm({ user }) {
  const f = useSaveForm({
    initial: toForm(user),
    fields: FIELDS,
    save: (values) => accountService.updateAccount(values),
    successMessage: "Account details saved",
    // Re-hydrate the session so the header reflects the new name.
    onSaved: () => window.dispatchEvent(new Event("auth:refresh-me")),
  });

  return (
    <form onSubmit={f.onSubmit} noValidate className="space-y-10">
      <Section
        title="Personal information"
        description="Your name and email address as they appear across the system."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="First name"
            name="first_name"
            autoComplete="given-name"
            value={f.form.first_name}
            onChange={f.onChange}
            error={f.fieldErrors.first_name}
          />
          <TextField
            label="Middle name"
            hint="Optional"
            name="middle_name"
            autoComplete="additional-name"
            value={f.form.middle_name}
            onChange={f.onChange}
            error={f.fieldErrors.middle_name}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Last name"
              name="last_name"
              autoComplete="family-name"
              value={f.form.last_name}
              onChange={f.onChange}
              error={f.fieldErrors.last_name}
            />
          </div>
        </div>

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
          value={f.form.email}
          onChange={f.onChange}
          error={f.fieldErrors.email}
        />
      </Section>

      <FormFooter
        submitting={f.submitting}
        message={f.message}
        error={f.error}
        dirty={f.dirty}
        onDiscard={f.reset}
      />
    </form>
  );
}