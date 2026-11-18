import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FormSection, FormActions, Field, SelectField, TextareaField } from "../../../components/ldea/fields";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { mohService } from "../../../services/mohService";
import { useAuth } from "../../../contexts/AuthContext";

import {
  COUNTY_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  PROFESSIONAL_STATUS_OPTIONS,
} from "../../../constants/counties";
import { useAllowedCounties } from "../../../hooks/useAllowedCounties";

// --- Options from the Model ---
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "widowed", label: "Widowed" },
  { value: "other", label: "Other" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "occasional", label: "Occasional" },
];

const METHOD_OPTIONS = [
  { value: "smoking", label: "Smoking" },
  { value: "injecting", label: "Injecting" },
  { value: "oral", label: "Oral" },
  { value: "snorting", label: "Snorting" },
  { value: "inhaling", label: "Inhaling" },
  { value: "other", label: "Other" },
];

const DEPENDENCY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

export default function MOHVictimFormPage() {
  const navigate = useNavigate();
  const { create, submitting } = useResourceMutation(mohService.victims);
  const { currentMembership } = useAuth();

  // --- Filter Counties based on User Scope ---
  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTY_OPTIONS;
    
    return COUNTY_OPTIONS.filter((opt) => {
      const countyValue = typeof opt === "string" ? opt : opt.value;
      return assigned.includes(countyValue);
    });
  }, [currentMembership]);

  // --- All Model Fields in the Initial State ---
  const [form, setForm] = useState({
    // Incident
    incident_date: "",
    incident_time: "",
    incident_location: "",
    incident_county: countyOptions.length === 1 ? countyOptions[0].value : "",
    
    // Personal Info
    first_name: "",
    middle_name: "",
    last_name: "",
    other_name: "",
    gender: "",
    date_of_birth: "",
    phone_number: "",
    email: "",
    county_resident: countyOptions.length === 1 ? countyOptions[0].value : "",
    district: "",
    address: "",
    professional_status: "",
    educational_level: "",
    marital_status: "",
    nationality: "Liberian",
    
    // Substance Use
    type_of_drug_used: "",
    primary_substance_user: "",
    frequency_of_use: "",
    last_used_date: "",
    age_first_used: "",
    duration_of_addiction_years: "",
    method_of_use: "",
    dependency_level: "",
    
    // Health & Rehab
    overdose_history: false,
    overdose_count: "",
    mental_health_issues: false,
    rehab_history: false,
    rehab_details: "",
    arrest_reference: "",
    
    // Meta
    remarks: "",
  });
  useEffect(() => {
      if (countyOptions.length === 1) {
        setForm((f) => (f.county_resident ? f : { ...f, county_resident: countyOptions[0].value }));
      }
      }, [countyOptions])
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === "checkbox" ? checked : value 
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    // Normalize data for Django
    const payload = { ...form };
    
    // Convert empty strings to null for Date/Time/Number fields
    const nullableFields = [
      "incident_time", "date_of_birth", "last_used_date", 
      "age_first_used", "duration_of_addiction_years", "overdose_count"
    ];
    nullableFields.forEach(field => {
      if (!payload[field]) payload[field] = null;
    });

    const result = await create(payload);

    if (result.ok) {
      navigate("/moh/victims", { replace: true });
    } else {
      console.error("Full Backend Error:", result);
      setFieldErrors(result.fieldErrors || {});
      
      let exactError = result.formError || "Validation failed.";
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        exactError = JSON.stringify(result.fieldErrors, null, 2);
      }
      setFormError(exactError);
    }
  }


  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 p-4 sm:p-6">
      <div>
        <Link to="/moh/victims" className="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content mb-2">
          <ArrowLeft className="size-4" /> Back to Victims
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Moh Register New Beneficiaries</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Create a brand new person in the LDEA database.
        </p>
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error font-mono whitespace-pre-wrap">
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* INCIDENT DETAILS */}
        <FormSection title="Incident Details">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Incident date" name="incident_date" type="date" required value={form.incident_date} onChange={onChange} error={fieldErrors.incident_date} />
            <Field label="Incident time" name="incident_time" type="time" value={form.incident_time} onChange={onChange} error={fieldErrors.incident_time} />
            
            {/* SCOPED: Uses allowedCounties */}
            <SelectField label="Incident county" name="incident_county" required value={form.incident_county} onChange={onChange} error={fieldErrors.incident_county} options={allowedCounties} placeholder="Select county"/>
            
            <div className="sm:col-span-3">
              <Field label="Incident location" name="incident_location" required value={form.incident_location} onChange={onChange} error={fieldErrors.incident_location} />
            </div>
          </div>
        </FormSection>

        {/* PERSONAL INFORMATION */}
        <FormSection title="Personal Information">
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
            {/* REVERTED: Uses COUNTY_OPTIONS (all counties) */}
            <SelectField label="County of residence" name="county_resident" required value={form.county_resident} onChange={onChange} error={fieldErrors.county_resident} options={COUNTY_OPTIONS} placeholder="Select county"/>
            
            <Field label="District" name="district" value={form.district} onChange={onChange} error={fieldErrors.district} />
            <SelectField label="Professional status" name="professional_status" required value={form.professional_status} onChange={onChange} error={fieldErrors.professional_status} options={PROFESSIONAL_STATUS_OPTIONS} placeholder="Select status"/>
            <SelectField label="Education level" name="educational_level" required value={form.educational_level} onChange={onChange} error={fieldErrors.educational_level} options={EDUCATION_LEVEL_OPTIONS} placeholder="Select level"/>
          </div>
          <TextareaField label="Address" name="address" value={form.address} onChange={onChange} error={fieldErrors.address} />
        </FormSection>

        {/* SUBSTANCE USE */}
        <FormSection title="Substance Use">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type of drug used" name="type_of_drug_used" value={form.type_of_drug_used} onChange={onChange} error={fieldErrors.type_of_drug_used} />
            <Field label="Primary substance" name="primary_substance_user" value={form.primary_substance_user} onChange={onChange} error={fieldErrors.primary_substance_user} />
            <SelectField label="Frequency" name="frequency_of_use" value={form.frequency_of_use} onChange={onChange} error={fieldErrors.frequency_of_use} options={FREQUENCY_OPTIONS} placeholder="Select frequency" />
            <SelectField label="Method" name="method_of_use" value={form.method_of_use} onChange={onChange} error={fieldErrors.method_of_use} options={METHOD_OPTIONS} placeholder="Select method" />
            <Field label="Age first used" name="age_first_used" type="number" min="0" max="130" value={form.age_first_used} onChange={onChange} error={fieldErrors.age_first_used} />
            <Field label="Years of addiction" name="duration_of_addiction_years" type="number" min="0" value={form.duration_of_addiction_years} onChange={onChange} error={fieldErrors.duration_of_addiction_years} />
            <Field label="Last used" name="last_used_date" type="date" value={form.last_used_date} onChange={onChange} error={fieldErrors.last_used_date} />
            <SelectField label="Dependency level" name="dependency_level" value={form.dependency_level} onChange={onChange} error={fieldErrors.dependency_level} options={DEPENDENCY_OPTIONS} placeholder="Select level" />
            <Field label="Arrest reference" name="arrest_reference" value={form.arrest_reference} onChange={onChange} error={fieldErrors.arrest_reference} hint="If applicable" />
          </div>
        </FormSection>

        {/* HEALTH & REHAB */}
        <FormSection title="Health & Rehab">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center gap-2.5">
                <input type="checkbox" name="overdose_history" checked={form.overdose_history} onChange={onChange} className="checkbox checkbox-sm" />
                <span className="text-sm">History of overdose</span>
              </label>
              {form.overdose_history && (
                <Field label="Overdose count" name="overdose_count" type="number" min="0" value={form.overdose_count} onChange={onChange} error={fieldErrors.overdose_count} />
              )}
              <label className="flex items-center gap-2.5">
                <input type="checkbox" name="mental_health_issues" checked={form.mental_health_issues} onChange={onChange} className="checkbox checkbox-sm" />
                <span className="text-sm">Mental health issues noted</span>
              </label>
              <label className="flex items-center gap-2.5">
                <input type="checkbox" name="rehab_history" checked={form.rehab_history} onChange={onChange} className="checkbox checkbox-sm" />
                <span className="text-sm">Previous rehabilitation</span>
              </label>
            </div>
            <div>
               {form.rehab_history && (
                <TextareaField label="Rehabilitation details" name="rehab_details" value={form.rehab_details} onChange={onChange} error={fieldErrors.rehab_details} />
              )}
            </div>
          </div>
        </FormSection>

        {/* ADDITIONAL DETAILS */}
        <FormSection title="Additional Details">
          <TextareaField label="Remarks" name="remarks" value={form.remarks} onChange={onChange} error={fieldErrors.remarks} />
        </FormSection>

        <FormActions 
          submitting={submitting} 
          onCancel={() => navigate(-1)} 
          submitLabel="Register Victim" 
        />
      </form>
    </div>
  );
}