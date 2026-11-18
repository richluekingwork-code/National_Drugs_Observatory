import { SchemaForm } from "../../../components/mog/SchemaForm";
import { FormActions } from "../../../components/ldea/fields";
import { useMOGForm } from "../../../components/mog/useMOGForm";
import { mohService } from "../../../services/mohService";

const FACILITY_TYPES = [
  { value: "inpatient",  label: "Inpatient Rehabilitation" },
  { value: "outpatient", label: "Outpatient Treatment" },
  { value: "detox",      label: "Detoxification" },
  { value: "community",  label: "Community-Based" },
  { value: "hospital",   label: "Hospital-Based" },
  { value: "private",    label: "Private Facility" },
  { value: "government", label: "Government Facility" },
];

const OWNERSHIP_TYPES = [
  { value: "government",  label: "Government" },
  { value: "private",     label: "Private" },
  { value: "ngo",         label: "NGO" },
  { value: "faith_based", label: "Faith-Based" },
];

const OPERATIONAL_STATUS = [
  { value: "active",    label: "Active" },
  { value: "inactive",  label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "closed",    label: "Closed" },
];

const EMPTY = {
  facility_name: "", facility_type: "", ownership_type: "",
  county: "", district: "", city_town: "", physical_address: "",
  contact_person: "", phone_number: "", alternate_phone: "", email: "", website: "",
  licensed: false, license_number: "", license_issue_date: "", license_expiry_date: "",
  total_beds: 0, male_beds: 0, female_beds: 0, adolescent_beds: 0, current_occupancy: 0,
  detoxification_services: false, inpatient_services: false, outpatient_services: false,
  counseling_services: false, family_therapy: false, group_therapy: false,
  medication_assisted_treatment: false, mental_health_services: false,
  vocational_training: false, aftercare_services: false,
  medical_doctors: 0, psychiatrists: 0, psychologists: 0, nurses: 0,
  counselors: 0, social_workers: 0, peer_support_workers: 0,
  operational_status: "active", opening_hours: "",
  accepts_referrals: true, emergency_services_available: false,
  reporting_year: new Date().getFullYear(), reporting_quarter: "", remarks: "",
};

const SECTIONS = [
  { title: "Facility profile", fields: [
    { name: "facility_name", label: "Facility name", required: true },
    { fields: [
      { name: "facility_type", label: "Type", type: "select", options: FACILITY_TYPES, required: true },
      { name: "ownership_type", label: "Ownership", type: "select", options: OWNERSHIP_TYPES, required: true },
    ]},
  ]},
  { title: "Location", fields: [
    { fields: [
      { name: "county", label: "County", required: true },
      { name: "district", label: "District" },
      { name: "city_town", label: "City / town" },
    ]},
    { name: "physical_address", label: "Physical address", type: "textarea", rows: 2 },
  ]},
  { title: "Contact", fields: [
    { fields: [
      { name: "contact_person", label: "Contact person" },
      { name: "phone_number", label: "Phone" },
      { name: "alternate_phone", label: "Alternate phone" },
    ]},
    { fields: [
      { name: "email", label: "Email", type: "email" },
      { name: "website", label: "Website", type: "url" },
    ]},
  ]},
  { title: "Licensing", fields: [
    { name: "licensed", label: "Licensed", type: "checkbox" },
    { fields: [
      { name: "license_number", label: "License number" },
      { name: "license_issue_date", label: "Issued", type: "date" },
      { name: "license_expiry_date", label: "Expires", type: "date" },
    ]},
  ]},
  { title: "Capacity", fields: [
    { fields: [
      { name: "total_beds", label: "Total beds", type: "number", min: 0 },
      { name: "male_beds", label: "Male beds", type: "number", min: 0 },
      { name: "female_beds", label: "Female beds", type: "number", min: 0 },
    ]},
    { fields: [
      { name: "adolescent_beds", label: "Adolescent beds", type: "number", min: 0 },
      { name: "current_occupancy", label: "Current occupancy", type: "number", min: 0 },
    ]},
  ]},
  { title: "Services", fields: [
    { fields: [
      { name: "detoxification_services", label: "Detoxification", type: "checkbox" },
      { name: "inpatient_services", label: "Inpatient", type: "checkbox" },
      { name: "outpatient_services", label: "Outpatient", type: "checkbox" },
    ]},
    { fields: [
      { name: "counseling_services", label: "Counseling", type: "checkbox" },
      { name: "family_therapy", label: "Family therapy", type: "checkbox" },
      { name: "group_therapy", label: "Group therapy", type: "checkbox" },
    ]},
    { fields: [
      { name: "medication_assisted_treatment", label: "MAT", type: "checkbox" },
      { name: "mental_health_services", label: "Mental health", type: "checkbox" },
      { name: "vocational_training", label: "Vocational", type: "checkbox" },
    ]},
    { name: "aftercare_services", label: "Aftercare", type: "checkbox" },
  ]},
  { title: "Staffing", fields: [
    { fields: [
      { name: "medical_doctors", label: "Medical doctors", type: "number", min: 0 },
      { name: "psychiatrists", label: "Psychiatrists", type: "number", min: 0 },
      { name: "psychologists", label: "Psychologists", type: "number", min: 0 },
    ]},
    { fields: [
      { name: "nurses", label: "Nurses", type: "number", min: 0 },
      { name: "counselors", label: "Counselors", type: "number", min: 0 },
      { name: "social_workers", label: "Social workers", type: "number", min: 0 },
    ]},
    { name: "peer_support_workers", label: "Peer support workers", type: "number", min: 0 },
  ]},
  { title: "Operations", fields: [
    { fields: [
      { name: "operational_status", label: "Status", type: "select", options: OPERATIONAL_STATUS, required: true },
      { name: "opening_hours", label: "Opening hours" },
    ]},
    { fields: [
      { name: "accepts_referrals", label: "Accepts referrals", type: "checkbox" },
      { name: "emergency_services_available", label: "Emergency services", type: "checkbox" },
    ]},
  ]},
  { title: "Reporting", fields: [
    { fields: [
      { name: "reporting_year", label: "Reporting year", type: "number", required: true },
      { name: "reporting_quarter", label: "Quarter" },
    ]},
    { name: "remarks", label: "Remarks", type: "textarea", rows: 3 },
  ]},
];

function normalize(form) {
  const out = { ...form };
  for (const k of ["license_issue_date", "license_expiry_date"]) {
    if (out[k] === "") out[k] = null;
  }
  for (const k of [
    "total_beds", "male_beds", "female_beds", "adolescent_beds", "current_occupancy",
    "medical_doctors", "psychiatrists", "psychologists", "nurses",
    "counselors", "social_workers", "peer_support_workers", "reporting_year",
  ]) {
    if (out[k] === "" || out[k] == null) out[k] = 0;
    else out[k] = Number(out[k]);
  }
  return out;
}

export default function FacilityFormPage() {
  const f = useMOGForm({
    resource: mohService.facilities,
    empty: EMPTY,
    normalize,
    redirectAfter: (r) => `/moh/facilities/${r.id}`,
  });

  return (
    <form onSubmit={f.submit} className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {f.isEdit ? "Edit facility" : "New treatment facility"}
        </h1>
      </header>
      {f.formError && (
        <div role="alert" className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
          {f.formError}
        </div>
      )}
      <SchemaForm sections={SECTIONS} values={f.form} errors={f.fieldErrors} onChange={f.setField} disabled={f.submitting} />
      <FormActions submitting={f.submitting} onCancel={() => f.navigate(-1)} submitLabel={f.isEdit ? "Save changes" : "Create facility"} />
    </form>
  );
}