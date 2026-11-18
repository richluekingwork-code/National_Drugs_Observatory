import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Wand2 } from "lucide-react";
import {
  FormActions,
  Field, SelectField, TextareaField, PhotoField,
} from "../../../components/ldea/fields";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

const STATUS_OPTIONS = [
  { value: "detained",    label: "Detained" },
  { value: "released",    label: "Released" },
  { value: "transferred", label: "Transferred to Court" },
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

const PROFESSIONAL_OPTIONS = [
  { value: "unemployed",    label: "Unemployed" },
  { value: "student",       label: "Student" },
  { value: "farmer",        label: "Farmer" },
  { value: "trader",        label: "Trader / Market" },
  { value: "driver",        label: "Driver" },
  { value: "teacher",       label: "Teacher" },
  { value: "nurse",         label: "Nurse / Health worker" },
  { value: "civil_servant", label: "Civil servant" },
  { value: "security",      label: "Security" },
  { value: "laborer",       label: "Laborer" },
  { value: "self_employed", label: "Self-employed" },
  { value: "other",         label: "Other" },
];

const EDUCATION_OPTIONS = [
  { value: "none",                 label: "None" },
  { value: "primary",              label: "Primary" },
  { value: "junior_high",          label: "Junior High" },
  { value: "senior_high",          label: "Senior High" },
  { value: "technical_vocational", label: "Technical / Vocational" },
  { value: "university",           label: "University" },
  { value: "postgraduate",         label: "Postgraduate" },
  { value: "other",                label: "Other" },
];

const EMPTY = {
  arrests_number: "",
  arrest_date: "",
  arrest_time: "",
  county_of_arrests: "",
  district_of_arrests: "",
  location_of_arrests: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  other_name: "",
  gender: "",
  date_of_birth: "",
  phone_number: "",
  email: "",
  county: "",
  district: "",
  address: "",
  professional_status: "",
  educational_level: "",
  marital_status: "",
  nationality: "Liberian",
  drug_type: "",
  quantity: "",
  unit: "",
  charges: "",
  arresting_officer: "",
  badge_number: "",
  status: "detained",
  remarks: "",
};

export default function ArrestFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.arrests, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.arrests);

  const [drugTypes, setDrugTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [checkingNumber, setCheckingNumber] = useState(false);

  useEffect(() => {
    ldeaService.drugTypes.list({ page: 1 })
      .then((d) => setDrugTypes(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => {});
  }, []);

  // Helper to find the ABSOLUTE highest number from the database and add 1
  async function getNextAvailableNumber() {
    try {
      // Fetch a large number of records to find the true mathematical max
      const res = await ldeaService.arrests.list({ page: 1, page_size: 500 });
      const results = res.results ?? res;
      
      let maxNum = 0;
      let prefix = `ARR-${new Date().getFullYear()}-`;
      let padLength = 3;

      if (results && results.length > 0) {
        results.forEach(r => {
          if (r.arrests_number) {
            const match = r.arrests_number.match(/(.*?)(\d+)$/);
            if (match) {
              prefix = match[1];
              padLength = Math.max(padLength, match[2].length);
              const num = parseInt(match[2], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        });
      }
      
      const nextVal = (maxNum + 1).toString().padStart(padLength, "0");
      return `${prefix}${nextVal}`;
    } catch (err) {
      return `ARR-${new Date().getFullYear()}-001`;
    }
  }

  // Auto-generate the next number when creating a new record
  useEffect(() => {
    if (isEdit) return;
    getNextAvailableNumber().then(num => {
      setForm(f => ({ ...f, arrests_number: num }));
    });
  }, [isEdit]);

  useEffect(() => {
    if (!existing) return;
    const next = { ...EMPTY };
    for (const k of Object.keys(EMPTY)) {
      if (existing[k] !== null && existing[k] !== undefined) {
        next[k] = existing[k];
      }
    }
    setForm(next);
  }, [existing]);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Check if the typed number exists when the user clicks away
  async function handleNumberBlur(e) {
    const val = e.target.value.trim();
    if (!val || isEdit) return;

    setCheckingNumber(true);
    try {
      // Exact match check
      const res = await ldeaService.arrests.list({ search: val, page: 1 });
      const results = res.results ?? res;
      const exists = results.some(r => r.arrests_number.toLowerCase() === val.toLowerCase());
      
      if (exists) {
        // If it exists, fetch the TRUE maximum number and update the field
        const nextNum = await getNextAvailableNumber();
        setForm(f => ({ ...f, arrests_number: nextNum }));
      }
    } catch (err) {
      // Ignore
    } finally {
      setCheckingNumber(false);
    }
  }

  // Manual trigger for the auto-generate button
  async function handleAutoGenerate() {
    setCheckingNumber(true);
    const nextNum = await getNextAvailableNumber();
    setForm(f => ({ ...f, arrests_number: nextNum }));
    setCheckingNumber(false);
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
      navigate(`/arrests`, { replace: true });
    } else {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
    }
  }

  if (isEdit && loadingRecord) {
    return <div className="grid place-items-center py-24"><span className="loading loading-spinner text-primary" /></div>;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit arrest" : "Record arrest"}</h1>
        <p className="text-sm text-base-content/60">Log the person, location, and charges.</p>
      </header>

      {formError && (
        <div role="alert" className="alert alert-error text-sm"><span>{formError}</span></div>
      )}

      {/* ARREST DETAILS */}
      <div className="card bg-base-100 border border-base-300 p-5 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Arrest Information</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          
          {/* Arrest Number with Auto-Generate button */}
          <div className="relative flex items-end">
            <div className="flex-1">
              <Field 
                label="Arrest Number" 
                name="arrests_number" 
                required 
                value={form.arrests_number} 
                onChange={onChange} 
                onBlur={handleNumberBlur}
                error={fieldErrors.arrests_number} 
                placeholder="e.g. ARR-2026-001" 
              />
            </div>
            {!isEdit && (
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={checkingNumber}
                className="btn btn-ghost btn-sm h-[42px] ml-2 text-primary"
                title="Auto-generate next number"
              >
                {checkingNumber ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Wand2 className="size-5" />
                )}
              </button>
            )}
          </div>

          <Field label="Arrest Date" name="arrest_date" type="date" required value={form.arrest_date} onChange={onChange} error={fieldErrors.arrest_date} />
          <Field label="Arrest Time" name="arrest_time" type="time" value={form.arrest_time} onChange={onChange} error={fieldErrors.arrest_time} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="County of Arrest" name="county_of_arrests" value={form.county_of_arrests} onChange={onChange} error={fieldErrors.county_of_arrests} options={COUNTY_OPTIONS} placeholder="Select county" />
          <Field label="District of Arrest" name="district_of_arrests" value={form.district_of_arrests} onChange={onChange} error={fieldErrors.district_of_arrests} />
          <SelectField label="Status" name="status" required value={form.status} onChange={onChange} error={fieldErrors.status} options={STATUS_OPTIONS} />
        </div>
        <TextareaField label="Location Description" name="location_of_arrests" value={form.location_of_arrests} onChange={onChange} error={fieldErrors.location_of_arrests} />
      </div>

      {/* PERSONAL INFO */}
      <div className="card bg-base-100 border border-base-300 p-5 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Personal Information</h2>
        
        <div className="mb-4">
          <PhotoField 
            label="Arrestee Photo" 
            name="photo" 
            currentUrl={existing?.photo} 
            error={fieldErrors.photo} 
            onChange={setPhoto} 
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="First Name" name="first_name" required value={form.first_name} onChange={onChange} error={fieldErrors.first_name} />
          <Field label="Last Name" name="last_name" required value={form.last_name} onChange={onChange} error={fieldErrors.last_name} />
          <Field label="Middle Name" name="middle_name" value={form.middle_name} onChange={onChange} error={fieldErrors.middle_name} />
          <Field label="Other Name" name="other_name" value={form.other_name} onChange={onChange} error={fieldErrors.other_name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Gender" name="gender" required value={form.gender} onChange={onChange} error={fieldErrors.gender} options={GENDER_OPTIONS} placeholder="Select" />
          <Field label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={onChange} error={fieldErrors.date_of_birth} />
          <Field label="Nationality" name="nationality" value={form.nationality} onChange={onChange} error={fieldErrors.nationality} />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone Number" name="phone_number" value={form.phone_number} onChange={onChange} error={fieldErrors.phone_number} />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={fieldErrors.email} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Residence County" name="county" value={form.county} onChange={onChange} error={fieldErrors.county} options={COUNTY_OPTIONS} placeholder="Select" />
          <Field label="Residence District" name="district" value={form.district} onChange={onChange} error={fieldErrors.district} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Professional Status" name="professional_status" value={form.professional_status} onChange={onChange} error={fieldErrors.professional_status} options={PROFESSIONAL_OPTIONS} placeholder="Select status" />
          <SelectField label="Educational Level" name="educational_level" value={form.educational_level} onChange={onChange} error={fieldErrors.educational_level} options={EDUCATION_OPTIONS} placeholder="Select level" />
          <SelectField label="Marital Status" name="marital_status" value={form.marital_status} onChange={onChange} error={fieldErrors.marital_status} options={MARITAL_OPTIONS} placeholder="Select status" />
        </div>
        
        <TextareaField label="Address" name="address" value={form.address} onChange={onChange} error={fieldErrors.address} />
      </div>

      {/* SUBSTANCE & OFFICER */}
      <div className="card bg-base-100 border border-base-300 p-5 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Substance & Officer</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Drug Type" name="drug_type" value={form.drug_type} onChange={onChange} error={fieldErrors.drug_type} options={drugTypes.map(d => ({ value: d.name, label: d.name }))} placeholder="Select drug" />
          <Field label="Quantity" name="quantity" type="number" step="0.01" value={form.quantity} onChange={onChange} error={fieldErrors.quantity} />
          <Field label="Unit" name="unit" value={form.unit} onChange={onChange} error={fieldErrors.unit} hint="e.g. grams, pills" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Arresting Officer" name="arresting_officer" required value={form.arresting_officer} onChange={onChange} error={fieldErrors.arresting_officer} />
          <Field label="Badge Number" name="badge_number" value={form.badge_number} onChange={onChange} error={fieldErrors.badge_number} />
        </div>
        <TextareaField label="Charges" name="charges" value={form.charges} onChange={onChange} error={fieldErrors.charges} />
        <TextareaField label="Remarks" name="remarks" value={form.remarks} onChange={onChange} error={fieldErrors.remarks} />
      </div>

      <div className="sticky bottom-3 z-20">
        <div className="card bg-base-100 border border-base-300 shadow-lg p-3">
          <FormActions submitting={submitting} onCancel={() => navigate(-1)} submitLabel={isEdit ? "Save changes" : "Record arrest"} />
        </div>
      </div>
    </form>
  );
}

function normalize(form) {
  const out = { ...form };
  if (out.quantity === "") out.quantity = null;
  if (out.quantity) out.quantity = Number(out.quantity);
  if (out.arrest_time === "") out.arrest_time = null;
  if (out.date_of_birth === "") out.date_of_birth = null;
  return out;
}

function toFormData(payload, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined) fd.append(k, v);
  }
  fd.append("photo", file);
  return fd;
}