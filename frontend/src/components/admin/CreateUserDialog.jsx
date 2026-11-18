import { useEffect, useId, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";

const ROLE_OPTIONS = [
  { value: "department_head", label: "Department Head" },
  { value: "data_officer", label: "Data Officer" },
//   { value: "analyst", label: "Data Analyst" },
//   { value: "viewer", label: "Read-only Viewer" },
];

export default function CreateUserDialog({
  onClose,
  onCreated,
  defaultInstitutionCode = "",
}) {
  const { currentMembership, user } = useAuth();

  // Only Django superusers can see the institution_admin role.
  const isSuperuser = user?.is_superuser === true;

  const roleOptions = isSuperuser
    ? [
        {
          value: "institution_admin",
          label: "Institution Administrator",
        },
        ...ROLE_OPTIONS,
      ]
    : ROLE_OPTIONS;

  const [institutions, setInstitutions] = useState([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    job_title: "",
    department: "",
    employee_number: "",
    institution_code:
      defaultInstitutionCode ||
      currentMembership?.institution?.code ||
      currentMembership?.institution?.name ||
      "",
    role: "data_officer",
  });

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const dialogRef = useRef(null);
  const titleId = useId();

  // Load available institutions.
  useEffect(() => {
    adminService
      .listInstitutions()
      .then(setInstitutions)
      .catch(() => {
        setFormError("Could not load institutions.");
      });
  }, []);

  // Focus management and Escape key.
  useEffect(() => {
    const first = dialogRef.current?.querySelector(
      "input, select, button"
    );

    first?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Update form values.
  function onChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear the field error when the user edits it.
    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  // Submit user creation request.
  async function onSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      // Prevent non-superusers from submitting institution_admin.
      if (
        form.role === "institution_admin" &&
        !isSuperuser
      ) {
        setFormError(
          "Only superusers can assign the Institution Administrator role."
        );
        return;
      }

//       const payload = {
//         ...form,
//       };
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        institution_code: form.institution_code,
        role: form.role,
        profile: {
          job_title: form.job_title,
          department: form.department,
          employee_number: form.employee_number,
        },
      };

      await adminService.createUser(payload);

      onCreated?.();
      onClose();
    } catch (err) {
      const body = err?.response?.data;

      if (body && typeof body === "object") {
        const fields = {};
        let nonField = null;

        for (const [key, value] of Object.entries(body)) {
          const message = Array.isArray(value)
            ? value[0]
            : String(value);

          if (
            key === "non_field_errors" ||
            key === "detail"
          ) {
            nonField = message;
          } else {
            fields[key] = message;
          }
        }

        setFieldErrors(fields);

        if (nonField) {
          setFormError(nonField);
        }
      } else {
        setFormError(
          "Could not create user. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-[--radius-box] border border-base-300 bg-base-100 shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold"
            >
              Create user
            </h2>

            <p className="mt-0.5 text-xs text-base-content/60">
              The account is created and added to the selected institution.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="space-y-4 p-5"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error"
            >
              {formError}
            </div>
          )}

          {/* Username and Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <DialogField
              label="Username"
              name="username"
              value={form.username}
              onChange={onChange}
              error={fieldErrors.username}
              required
              autoComplete="off"
            />

            <DialogField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              error={fieldErrors.email}
              required
              autoComplete="off"
            />
          </div>

          {/* Password */}
          <DialogField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            error={fieldErrors.password}
            required
            autoComplete="new-password"
          />

          {/* Names */}
          <div className="grid gap-4 sm:grid-cols-3">
            <DialogField
              label="First name"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
              error={fieldErrors.first_name}
            />

            <DialogField
              label="Middle name"
              name="middle_name"
              value={form.middle_name}
              onChange={onChange}
              error={fieldErrors.middle_name}
            />

            <DialogField
              label="Last name"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
              error={fieldErrors.last_name}
            />
          </div>

          {/* Job title, Department, Employee number */}
          <div className="grid gap-4 sm:grid-cols-3">
            <DialogField
              label="Job title"
              name="job_title"
              value={form.job_title}
              onChange={onChange}
              error={fieldErrors.job_title}
            />

            <DialogField
              label="Department"
              name="department"
              value={form.department}
              onChange={onChange}
              error={fieldErrors.department}
            />

            <DialogField
              label="Employee number"
              name="employee_number"
              value={form.employee_number}
              onChange={onChange}
              error={fieldErrors.employee_number}
            />
          </div>

          {/* Institution and Role */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control w-full">
              <span className="label pb-1.5">
                <span className="label-text text-sm font-medium text-base-content/80">
                  Institution
                </span>
              </span>

              <select
                name="institution_code"
                value={form.institution_code}
                onChange={onChange}
                className="select select-bordered h-10 text-sm"
                required
              >
                <option value="">
                  Select institution
                </option>

                {institutions.map((inst) => (
                  <option
                    key={inst.id}
                    value={inst.code ?? inst.name}
                  >
                    {inst.name}
                  </option>
                ))}
              </select>

              {fieldErrors.institution_code && (
                <p
                  className="mt-1.5 text-xs text-error"
                  role="alert"
                >
                  {fieldErrors.institution_code}
                </p>
              )}
            </label>

            <label className="form-control w-full">
              <span className="label pb-1.5">
                <span className="label-text text-sm font-medium text-base-content/80">
                  Role
                </span>
              </span>

              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="select select-bordered h-10 text-sm"
                required
              >
                {roleOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {fieldErrors.role && (
                <p
                  className="mt-1.5 text-xs text-error"
                  role="alert"
                >
                  {fieldErrors.role}
                </p>
              )}
            </label>
          </div>

          {/* Footer */}
          <footer className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm normal-case"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm normal-case"
            >
              {submitting && (
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {submitting ? "Creating…" : "Create user"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

// Reusable form field.
function DialogField({
  label,
  name,
  type = "text",
  error,
  ...rest
}) {
  return (
    <label className="form-control w-full">
      <span className="label pb-1.5">
        <span className="label-text text-sm font-medium text-base-content/80">
          {label}
        </span>
      </span>

      <input
        name={name}
        type={type}
        aria-invalid={error ? "true" : undefined}
        className={
          "input input-bordered h-10 w-full text-sm " +
          (error ? "input-error" : "")
        }
        {...rest}
      />

      {error && (
        <p
          className="mt-1.5 text-xs text-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </label>
  );
}