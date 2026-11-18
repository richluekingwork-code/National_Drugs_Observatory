import { Lock, Phone } from "lucide-react";
import { useId } from "react";
import { accountService } from "../../services/accountService";
import { useSaveForm } from "./useSaveForm";
import { FormFooter, Section, TextArea, TextField } from "./formKit";

const FIELDS = ["gender", "phone", "address"];

const GENDERS = [
  { value: "", label: "Not specified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const toForm = (profile) => ({
  gender: profile?.gender ?? "",
  phone: profile?.phone ?? "",
  address: profile?.address ?? "",
});

export default function ProfileForm({ user }) {
  const profile = user?.profile ?? {};

  const f = useSaveForm({
    initial: toForm(profile),
    fields: FIELDS,
    save: (values) => {
      if (!user?.id) throw new Error("Missing user id");
      return accountService.updateProfile(user.id, values);
    },
    successMessage: "Profile saved",
    onSaved: () => window.dispatchEvent(new Event("auth:refresh-me")),
  });

  return (
    <form onSubmit={f.onSubmit} noValidate className="space-y-10">
      <Section
        title="Contact details"
        description="How your institution can reach you."
      >
        <GenderPicker
          value={f.form.gender}
          onChange={(v) => f.setField("gender", v)}
          error={f.fieldErrors.gender}
        />

        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+231 77 000 0000"
          value={f.form.phone}
          onChange={f.onChange}
          error={f.fieldErrors.phone}
          icon={<Phone className="size-4" aria-hidden="true" />}
        />

        <TextArea
          label="Address"
          name="address"
          rows={3}
          autoComplete="street-address"
          placeholder="Street, community, city"
          value={f.form.address}
          onChange={f.onChange}
          error={f.fieldErrors.address}
        />
      </Section>

      <div className="divider my-0" />

      <Section
        title="Work details"
        description="Set by your administrator. Contact them if something is wrong."
      >
        <dl className="grid gap-px overflow-hidden rounded-[--radius-box] border border-base-300 bg-base-300 sm:grid-cols-3">
          <ReadOnly label="Job title" value={profile.job_title} />
          <ReadOnly label="Department" value={profile.department} />
          <ReadOnly label="Employee number" value={profile.employee_number} />
        </dl>
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

function ReadOnly({ label, value }) {
  return (
    <div className="bg-base-200/50 px-4 py-3.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-base-content/60">
        <Lock className="size-3" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-base-content">
        {value || <span className="font-normal text-base-content/40">Not set</span>}
      </dd>
    </div>
  );
}

function GenderPicker({ value, onChange, error }) {
  const group = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-base-content/80">
        Gender
      </legend>

      <div className="inline-flex w-full flex-wrap gap-1 rounded-[--radius-field] bg-base-200 p-1 sm:w-auto">
        {GENDERS.map((g) => (
          <label key={g.value || "none"} className="flex-1 sm:flex-none">
            <input
              type="radio"
              name={group}
              value={g.value}
              checked={value === g.value}
              onChange={() => onChange(g.value)}
              className="peer sr-only"
            />
            <span
              className={
                "block cursor-pointer select-none rounded-[calc(var(--radius-field)-2px)] px-3.5 py-1.5 " +
                "text-center text-sm font-medium text-base-content/60 transition-colors " +
                "hover:text-base-content " +
                "peer-checked:bg-base-100 peer-checked:text-base-content peer-checked:shadow-sm " +
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
              }
            >
              {g.label}
            </span>
          </label>
        ))}
      </div>

      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </fieldset>
  );
}