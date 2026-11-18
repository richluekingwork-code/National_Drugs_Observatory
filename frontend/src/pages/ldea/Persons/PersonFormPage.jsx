import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormSection, FormActions,
  Field, SelectField, TextareaField, PhotoField,
} from "../../../components/ldea/fields";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";

const ROLE_OPTIONS = [
  { value: "suspect", label: "Suspect" },
  { value: "victim",  label: "Victim" },
  { value: "witness", label: "Witness" },
];

const GENDER_OPTIONS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
];

const MARITAL_OPTIONS = [
  { value: "single",    label: "Single" },
  { value: "married",   label: "Married" },
  { value: "divorced",  label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "widowed",   label: "Widowed" },
  { value: "other",     label: "Other" },
];

const COUNTY_OPTIONS = [
  { value: "Bomi",             label: "Bomi" },
  { value: "Bong",             label: "Bong" },
  { value: "Gbarpolu",         label: "Gbarpolu" },
  { value: "Grand Bassa",      label: "Grand Bassa" },
  { value: "Grand Cape Mount", label: "Grand Cape Mount" },
  { value: "Grand Gedeh",      label: "Grand Gedeh" },
  { value: "Grand Kru",        label: "Grand Kru" },
  { value: "Lofa",             label: "Lofa" },
  { value: "Margibi",          label: "Margibi" },
  { value: "Maryland",         label: "Maryland" },
  { value: "Montserrado",      label: "Montserrado" },
  { value: "Nimba",            label: "Nimba" },
  { value: "Rivercess",        label: "Rivercess" },
  { value: "River Gee",        label: "River Gee" },
  { value: "Sinoe",            label: "Sinoe" },
];

const PROFESSIONAL_STATUS_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "job_seeker", label: "Actively Seeking Employment" },
  { value: "intern", label: "Intern / Trainee" },
  { value: "freelancer", label: "Freelancer" },
  { value: "entrepreneur", label: "Entrepreneur / Business Owner" },
  { value: "civil_servant", label: "Government Employee / Civil Servant" },
  { value: "retired", label: "Retired" },
];

const EDUCATION_OPTIONS = [
  { value: "primary", label: "Primary Education" },
  { value: "junior_high", label: "Junior High School" },
  { value: "senior_high", label: "Senior High School" },
  { value: "vocational", label: "Vocational / Technical Education" },
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate / PhD" },
];

const EMPTY = {
  first_name: "", middle_name: "", last_name: "", other_name: "",
  gender: "", date_of_birth: "",
  professional_status: "", educational_level: "",
  phone_number: "", email: "",
  national_id: "", passport_number: "",
  county: "", district: "", address: "",
  occupation: "", marital_status: "", nationality: "Liberian",
  is_repeat_offender: false, is_under_investigation: false,
  drug_user: "", remarks: "", role: "suspect",
};

function calculateAge(dob) {
  if (!dob) return "";
  const [year, month, day] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age >= 0 ? age : "";
}

const SECTION_ICONS = {
  Identity: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  Contact: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  "Documents & background": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Case context": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  Photo: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

function Section({ number, title, description, children }) {
  return (
    <section className="card bg-base-100 border border-base-300/70 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-base-300/60">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={SECTION_ICONS[title]} />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 badge badge-primary badge-xs h-4 min-w-4 text-[10px]">
              {number}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-xs text-base-content/55 mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}

function ToggleField({ label, name, checked, onChange, description }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
        checked ? "border-primary/40 bg-primary/5" : "border-base-300 hover:border-base-content/25"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="toggle toggle-primary toggle-sm"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-base-content/55 mt-0.5">{description}</span>}
      </span>
    </label>
  );
}

export default function PersonFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.persons, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.persons);

  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const age = calculateAge(form.date_of_birth);

  useEffect(() => {
    if (!existing) return;
    setForm({
      first_name: existing.first_name ?? "",
      middle_name: existing.middle_name ?? "",
      last_name: existing.last_name ?? "",
      other_name: existing.other_name ?? "",
      gender: existing.gender ?? "",
      date_of_birth: existing.date_of_birth ?? "",
      professional_status: existing.professional_status ?? "",
      educational_level: existing.educational_level ?? "",
      phone_number: existing.phone_number ?? "",
      email: existing.email ?? "",
      national_id: existing.national_id ?? "",
      passport_number: existing.passport_number ?? "",
      county: existing.county ?? "",
      district: existing.district ?? "",
      address: existing.address ?? "",
      occupation: existing.occupation ?? "",
      marital_status: existing.marital_status ?? "",
      nationality: existing.nationality ?? "Liberian",
      is_repeat_offender: Boolean(existing.is_repeat_offender),
      is_under_investigation: Boolean(existing.is_under_investigation),
      drug_user: existing.drug_user ?? "",
      remarks: existing.remarks ?? "",
      role: existing.role ?? "suspect",
    });
  }, [existing]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const payload = normalize(form);
    const body = photo ? toFormData(payload, photo) : payload;

    const result = isEdit ? await update(id, body) : await create(body);

    if (result.ok) {
      navigate(`/persons/${result.data.id}`, { replace: true });
    } else {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
    }
  }

  if (isEdit && loadingRecord) {
    return (
      <div className="grid place-items-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === form.role)?.label ?? "Suspect";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="sticky top-0 z-20 -mx-2 px-2 py-3 bg-base-200/80 backdrop-blur-md border-b border-base-300/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm btn-square rounded-lg"
              aria-label="Back"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                {isEdit ? "Edit person" : "Register person"}
              </h1>
              <p className="text-xs sm:text-sm text-base-content/55 truncate">
                {isEdit ? "Update identity and contact details." : "Register a suspect, victim, or witness."}
              </p>
            </div>
          </div>
          <span className={`badge badge-lg shrink-0 ${
            form.role === "suspect" ? "badge-error/15 text-error border-error/20"
            : form.role === "victim" ? "badge-info/15 text-info border-info/20"
            : "badge-warning/15 text-warning border-warning/20"
          }`}>
            {roleLabel}
          </span>
        </div>
      </div>

      {formError && (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <Section number={1} title="Identity" description="Legal name and basic demographics.">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="First name"  name="first_name"  required value={form.first_name}  onChange={onChange} error={fieldErrors.first_name} />
          <Field label="Middle name" name="middle_name" value={form.middle_name} onChange={onChange} error={fieldErrors.middle_name} />
          <Field label="Last name"   name="last_name"   required value={form.last_name}   onChange={onChange} error={fieldErrors.last_name} />
          <Field label="Other name"  name="other_name"  value={form.other_name}  onChange={onChange} error={fieldErrors.other_name} />        
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Gender" name="gender" required value={form.gender} onChange={onChange} error={fieldErrors.gender} options={GENDER_OPTIONS} placeholder="Select gender" />
          <Field label="Date of birth" name="date_of_birth" required type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={onChange} error={fieldErrors.date_of_birth} />
          <div className="form-control w-full">
            <label className="label" htmlFor="person-age"><span className="label-text font-medium">Age</span></label>
            <div className="relative">
              <input id="person-age" name="age" type="text" value={age === "" ? "" : `${age} years`} readOnly tabIndex={-1} aria-readonly="true" placeholder="—" className="input input-bordered w-full cursor-not-allowed bg-base-200/60 text-center font-semibold text-base-content/70"/>
            </div>
          </div>
        </div>
      </Section>

      <Section number={2} title="Contact" description="How this person can be reached or located.">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Phone" name="phone_number" value={form.phone_number} onChange={onChange} error={fieldErrors.phone_number} />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={fieldErrors.email} />
          <SelectField label="County" name="county" value={form.county} onChange={onChange} error={fieldErrors.county} options={COUNTY_OPTIONS} placeholder="Select county" />
          <Field label="District" name="district" value={form.district} onChange={onChange} error={fieldErrors.district} />
        </div>
       
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextareaField label="Address" name="address" value={form.address} onChange={onChange} error={fieldErrors.address} />
          </div>
        </div>
      </Section>

      <Section number={3} title="Documents & background" description="Identification, occupation and education.">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="National ID"     name="national_id"     value={form.national_id}     onChange={onChange} error={fieldErrors.national_id} />
          <Field label="Passport number" name="passport_number" value={form.passport_number} onChange={onChange} error={fieldErrors.passport_number} />
          <Field label="Occupation" name="occupation" required value={form.occupation} onChange={onChange} error={fieldErrors.occupation} />
          <SelectField label="Marital status" required name="marital_status" value={form.marital_status} onChange={onChange} error={fieldErrors.marital_status} options={MARITAL_OPTIONS} placeholder="Select status" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nationality" name="nationality" value={form.nationality} onChange={onChange} error={fieldErrors.nationality} />
          <SelectField label="Professional status" required name="professional_status" value={form.professional_status} onChange={onChange} error={fieldErrors.professional_status} options={PROFESSIONAL_STATUS_OPTIONS} placeholder="Select status" />
          <SelectField label="Educational level" required name="educational_level" value={form.educational_level} onChange={onChange} error={fieldErrors.educational_level} options={EDUCATION_OPTIONS} placeholder="Select level" />
        </div>
      </Section>

      <Section number={4} title="Case context" description="Role and investigative flags." >
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Role" name="role" required value={form.role} onChange={onChange} error={fieldErrors.role} options={ROLE_OPTIONS} placeholder="Select role"/>
          <Field label="Drug user" name="drug_user" value={form.drug_user} onChange={onChange} error={fieldErrors.drug_user} hint="If applicable" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          <ToggleField label="Repeat offender" description="Has prior records in the system" name="is_repeat_offender" checked={form.is_repeat_offender} onChange={onChange}/>
          <ToggleField label="Under investigation" description="Currently part of an active case" name="is_under_investigation" checked={form.is_under_investigation} onChange={onChange}/>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <div className="sm:col-span-3">
            <TextareaField label="Remarks" name="remarks" value={form.remarks} onChange={onChange} error={fieldErrors.remarks} />
          </div>
        </div>
      </Section>

      <Section number={5} title="Photo" description="Portrait for identification purposes.">
        <PhotoField
          label="Portrait"
          name="photo"
          currentUrl={existing?.photo}
          error={fieldErrors.photo}
          onChange={setPhoto}
        />
      </Section>

      <div className="sticky bottom-3 z-20">
        <div className="card bg-base-100/90 backdrop-blur-md border border-base-300/70 shadow-lg">
          <div className="card-body p-3 sm:px-4 flex-row items-center justify-between gap-3">
            <p className="hidden sm:block text-xs text-base-content/50">
              <span className="text-error">*</span> Required fields
            </p>
            <FormActions
              submitting={submitting}
              onCancel={() => navigate(-1)}
              submitLabel={isEdit ? "Save changes" : "Register person"}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function normalize(form) {
  const out = { ...form };
  delete out.age;
  if (out.date_of_birth === "") {
    out.date_of_birth = null;
  }
  return out;
}

function toFormData(payload, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "boolean") fd.append(k, v ? "true" : "false");
    else fd.append(k, v);
  }
  fd.append("photo", file);
  return fd;
}