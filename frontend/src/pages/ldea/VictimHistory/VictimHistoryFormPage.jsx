import { useEffect, useState } 
from "react";
import { useNavigate, useParams } 
from "react-router-dom";
import {FormSection, FormActions,Field, SelectField, TextareaField,} 
from "../../../components/ldea/fields";
import { useResource } 
from "../../../hooks/useResource";
import { useResourceMutation } 
from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";

import {COUNTY_OPTIONS,EDUCATION_LEVEL_OPTIONS,PROFESSIONAL_STATUS_OPTIONS,} 
from "../../../constants/counties";

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
const FREQUENCY_OPTIONS = [
  { value: "daily",      label: "Daily" },
  { value: "weekly",     label: "Weekly" },
  { value: "monthly",    label: "Monthly" },
  { value: "occasional", label: "Occasional" },
];
const METHOD_OPTIONS = [
  { value: "smoking",   label: "Smoking" },
  { value: "injecting", label: "Injecting" },
  { value: "oral",      label: "Oral" },
  { value: "snorting",  label: "Snorting" },
  { value: "inhaling",  label: "Inhaling" },
  { value: "other",     label: "Other" },
];
const DEPENDENCY_OPTIONS = [
  { value: "low",      label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high",     label: "High" },
];

const EMPTY = {
  incident_date: "",
  incident_time: "",
  incident_location: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  other_name: "",
  gender: "",
  date_of_birth: "",
  phone_number: "",
  email: "",
  incident_county: "",
  district: "",
  address: "",
  professional_status: "",
  educational_level: "",
  marital_status: "",
  nationality: "Liberian",
  type_of_drug_used: "",
  primary_substance_user: "",
  frequency_of_use: "",
  last_used_date: "",
  age_first_used: "",
  duration_of_addiction_years: "",
  method_of_use: "",
  dependency_level: "",
  overdose_history: false,
  overdose_count: "",
  mental_health_issues: false,
  rehab_history: false,
  rehab_details: "",
  arrest_reference: "",
  remarks: "",
  county_resident: "",
};

export default function VictimHistoryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(
    ldeaService.victimHistories, id,
  );
  const { create, update, submitting } = useResourceMutation(
    ldeaService.victimHistories,
  );

  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // ---- photo state -------------------------------------------------
  const [photoFile, setPhotoFile] = useState(null);          // new File chosen
  const [photoPreview, setPhotoPreview] = useState(null);    // preview URL
  const [removePhoto, setRemovePhoto] = useState(false);     // "delete existing"

  // hydrate form on edit
  useEffect(() => {
    if (!existing) return;
    const next = { ...EMPTY };
    for (const k of Object.keys(EMPTY)) {
      if (existing[k] !== null && existing[k] !== undefined) {
        next[k] = existing[k];
      }
    }
    setForm(next);
    if (existing.photo) setPhotoPreview(existing.photo);
  }, [existing]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setRemovePhoto(false);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      // reset to existing photo on cancel
      setPhotoPreview(existing?.photo ?? null);
    }
  }

  function onRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const payload = normalize(form);

    // If a new file was picked, or an existing one is being removed,
    // we must send FormData instead of JSON so the file reaches Django.
    const needsMultipart = Boolean(photoFile) || removePhoto;
    let dataToSend = payload;

    if (needsMultipart) {
      const fd = toFormData(payload);
      if (photoFile) {
        fd.append("photo", photoFile);
      } else if (removePhoto) {
        // DRF treats "" as "clear the ImageField"
        fd.append("photo", "");
      }
      dataToSend = fd;
    }

    const result = isEdit
      ? await update(id, dataToSend)
      : await create(dataToSend);

    if (result.ok) {
      navigate("/victim-histories", { replace: true });
    } else {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
    }
  }

  if (isEdit && loadingRecord) {
    return (
      <div className="grid place-items-center py-20">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {isEdit ? "Edit victim history" : "New victim history"}
        </h1>
        <p className="mt-0.5 text-sm text-base-content/60">
          Substance-use and health background for this victim.
        </p>
      </header>

      {formError && (
        <div
          role="alert"
          className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error"
        >
          {formError}
        </div>
      )}

      <FormSection title="Incident">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Incident date" name="incident_date" type="date" required value={form.incident_date} onChange={onChange} error={fieldErrors.incident_date} />
          <Field label="Incident time" name="incident_time" type="time" required value={form.incident_time} onChange={onChange} error={fieldErrors.incident_time} />
          <SelectField label="Incident county" name="incident_county" required value={form.incident_county} onChange={onChange} error={fieldErrors.incident_county} options={COUNTY_OPTIONS} placeholder="Select county"/>
        </div>
        <Field label="Incident location" name="incident_location" required value={form.incident_location} onChange={onChange} error={fieldErrors.incident_location} />
      </FormSection>

      <FormSection title="Personal">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {photoPreview ? (
            <img src={photoPreview} alt="Victim" className="h-28 w-28 rounded-lg object-cover ring-1 ring-base-300"/>) : (
            <div className="grid h-28 w-28 place-items-center rounded-lg bg-base-200 text-xs text-base-content/50">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="btn btn-sm btn-outline normal-case cursor-pointer">
              {photoPreview ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange}/>
            </label>
            {photoPreview && (
              <button type="button" className="btn btn-ghost btn-xs normal-case text-error" onClick={onRemovePhoto}>
                Remove photo
              </button>
            )}
            <p className="text-xs text-base-content/50">
              JPG or PNG, up to 5 MB.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First name"  name="first_name"  required value={form.first_name}  onChange={onChange} error={fieldErrors.first_name} />
          <Field label="Middle name" name="middle_name"          value={form.middle_name} onChange={onChange} error={fieldErrors.middle_name} />
          <Field label="Last name"   name="last_name"   required value={form.last_name}   onChange={onChange} error={fieldErrors.last_name} />
          <Field label="Other name"  name="other_name"           value={form.other_name}  onChange={onChange} error={fieldErrors.other_name} />
          <SelectField label="Gender" name="gender" required value={form.gender} onChange={onChange} error={fieldErrors.gender} options={GENDER_OPTIONS} placeholder="Select gender" />
          <Field label="Date of birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={onChange} error={fieldErrors.date_of_birth} />
          <SelectField label="Marital status" name="marital_status" required value={form.marital_status} onChange={onChange} error={fieldErrors.marital_status} options={MARITAL_OPTIONS} placeholder="Select status" />
          <Field label="Nationality" name="nationality" required value={form.nationality} onChange={onChange} error={fieldErrors.nationality} />
          <Field label="Phone"    name="phone_number" value={form.phone_number} onChange={onChange} error={fieldErrors.phone_number} />
          <Field label="Email"    name="email" type="email" value={form.email} onChange={onChange} error={fieldErrors.email} />
          <SelectField label="County of residence" name="county_resident" required value={form.county_resident} onChange={onChange} error={fieldErrors.county_resident} options={COUNTY_OPTIONS} placeholder="Select county"/>
          <Field label="District" name="district" value={form.district} onChange={onChange} error={fieldErrors.district} />
          <SelectField label="Professional status" name="professional_status" required value={form.professional_status} onChange={onChange} error={fieldErrors.professional_status} options={PROFESSIONAL_STATUS_OPTIONS} placeholder="Select status"/>
          <SelectField label="Education level" name="educational_level" required value={form.educational_level} onChange={onChange} error={fieldErrors.educational_level} options={EDUCATION_LEVEL_OPTIONS} placeholder="Select level"/>
        </div>
        <TextareaField label="Address" name="address" value={form.address} onChange={onChange} error={fieldErrors.address} />
      </FormSection>

      <FormSection title="Substance use">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type of drug used" name="type_of_drug_used" required value={form.type_of_drug_used} onChange={onChange} error={fieldErrors.type_of_drug_used} />
          <Field label="Primary substance" name="primary_substance_user" value={form.primary_substance_user} onChange={onChange} error={fieldErrors.primary_substance_user} />
          <SelectField label="Frequency" name="frequency_of_use" required value={form.frequency_of_use} onChange={onChange} error={fieldErrors.frequency_of_use} options={FREQUENCY_OPTIONS}  placeholder="Select frequency" />
          <SelectField label="Method"    name="method_of_use" required value={form.method_of_use}    onChange={onChange} error={fieldErrors.method_of_use}    options={METHOD_OPTIONS}     placeholder="Select method" />
          <Field label="Age first used"     name="age_first_used" required type="number" min="0" max="130" value={form.age_first_used} onChange={onChange} error={fieldErrors.age_first_used} />
          <Field label="Years of addiction" name="duration_of_addiction_years" required type="number" min="0" value={form.duration_of_addiction_years} onChange={onChange} error={fieldErrors.duration_of_addiction_years} />
          <Field label="Last used"          name="last_used_date" type="date" required value={form.last_used_date} onChange={onChange} error={fieldErrors.last_used_date} />
          <SelectField label="Dependency level" name="dependency_level" required value={form.dependency_level} onChange={onChange} error={fieldErrors.dependency_level} options={DEPENDENCY_OPTIONS} placeholder="Select level" />
          <Field label="Arrest reference" name="arrest_reference" value={form.arrest_reference} onChange={onChange} error={fieldErrors.arrest_reference} hint="If applicable" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="overdose_history" checked={form.overdose_history} onChange={onChange} className="checkbox checkbox-sm" />
            <span className="text-sm">History of overdose</span>
          </label>
          {form.overdose_history && (
            <Field label="Overdose count" name="overdose_count" type="number" min="0" value={form.overdose_count} onChange={onChange} error={fieldErrors.overdose_count} />
          )}
        </div>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" name="mental_health_issues" checked={form.mental_health_issues} onChange={onChange} className="checkbox checkbox-sm" />
          <span className="text-sm">Mental health issues noted</span>
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" name="rehab_history" checked={form.rehab_history} onChange={onChange} className="checkbox checkbox-sm" />
          <span className="text-sm">Previous rehabilitation</span>
        </label>
        {form.rehab_history && (
          <TextareaField label="Rehabilitation details" name="rehab_details" value={form.rehab_details} onChange={onChange} error={fieldErrors.rehab_details} />
        )}
        <TextareaField label="Remarks" name="remarks" value={form.remarks} onChange={onChange} error={fieldErrors.remarks} />
        <FormActions submitting={submitting}onCancel={() => navigate(-1)}submitLabel={isEdit ? "Save changes" : "Save history"}/>
      </FormSection>

      </form>
  );
}

function normalize(form) {
  const out = { ...form };
  for (const k of [
    "incident_time", "last_used_date", "date_of_birth",
    "age_first_used", "duration_of_addiction_years", "overdose_count",
  ]) {
    if (out[k] === "") out[k] = null;
  }
  for (const k of ["age_first_used", "duration_of_addiction_years", "overdose_count"]) {
    if (out[k] !== null) out[k] = Number(out[k]);
  }
  return out;
}

function toFormData(obj) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "boolean") fd.append(k, v ? "true" : "false");
    else if (v instanceof File) fd.append(k, v);
    else fd.append(k, String(v));
  }
  return fd;
}