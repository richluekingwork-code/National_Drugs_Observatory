import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SchemaForm } from "../../../components/mog/SchemaForm";
import { FormActions } from "../../../components/ldea/fields";
import { useMOGForm } from "../../../components/mog/useMOGForm";
import { mohService } from "../../../services/mohService";
import { COUNTY_OPTIONS } from "../../../constants/counties";
import { useAuth } from "../../../contexts/AuthContext";

const EMPTY = {
  person_ids: [],
  treatment: "", treatment_facility: "", type_of_treatment: "",
  cases: "", injection_substance: "", drug_test: "",
  county: "", city: "", district: "",
  psychotherapeutic_intervention: "", psychotropic_interventions: "",
  comorbid_conditions: "", route_of_administration: "",
  refer_from: "", refer_to: "", admission_status: "",
  receiving_facility_id: "",
};

// We pass allowedCounties into this function
const buildSections = (receivingFacilities, allowedCounties) => [
  {
    title: "Treatment",
    fields: [
      {
        fields: [
          { name: "treatment_facility", label: "Facility" },
          { name: "type_of_treatment", label: "Type of treatment" },
          { name: "cases", label: "Cases" },
        ],
      },
      { name: "treatment", label: "Treatment details", type: "textarea", rows: 3 },
      {
        fields: [
          { 
            name: "county", 
            label: "County", 
            type: "select", 
            options: allowedCounties, // <-- USING THE FILTERED OPTIONS HERE
            placeholder: "Select county" 
          },
          { name: "city", label: "City" },
          { name: "district", label: "District" },
        ],
      },
    ],
  },
  {
    title: "Clinical",
    fields: [
      {
        fields: [
          {
            name: "receiving_facility_id",
            label: "Facility Receiving Treatment",
            type: "select",
            options: receivingFacilities.map((fac) => ({
              value: String(fac.id),
              label: `${fac.facility_name} (${fac.county})`,
            })),
            placeholder: "No structured referral",
          },
          {
            name: "injection_substance",
            label: "Injection substance",
            type: "select",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ],
          },
          {
            name: "route_of_administration",
            label: "Route",
            type: "select",
            options: [
              { value: "oral", label: "Oral" },
              { value: "injection", label: "Injection" },
              { value: "smoking", label: "Smoking / Inhalation" },
              { value: "snorting", label: "Snorting" },
              { value: "other", label: "Other" },
            ],
          },
        ],
      },
      { name: "drug_test", label: "Drug test", type: "textarea", rows: 2 },
      {
        fields: [
          { name: "psychotherapeutic_intervention", label: "Psychotherapeutic" },
          { name: "psychotropic_interventions", label: "Psychotropic" },
          { name: "comorbid_conditions", label: "Comorbid conditions" },
        ],
      },
    ],
  },
  {
    title: "Referral",
    fields: [
      {
        fields: [
          { name: "refer_from", label: "Refer from" },
          { name: "refer_to", label: "Refer to" },
          {
            name: "admission_status",
            label: "Admission status",
            type: "select",
            options: [
              { value: "admitted", label: "Admitted" },
              { value: "waitlisted", label: "Waitlisted" },
              { value: "referred", label: "Referred" },
              { value: "declined", label: "Declined" },
              { value: "completed", label: "Completed" },
            ],
          },
        ],
      },
    ],
  },
];

function normalize(form) {
  const out = { ...form };
  out.person_ids = (out.person_ids ?? []).map(Number).filter(Boolean);
  out.receiving_facility_id =
    out.receiving_facility_id === "" || out.receiving_facility_id == null
      ? null
      : Number(out.receiving_facility_id);
  return out;
}

export default function DemandReductionFormPage() {
  const { options: countyOptions } = useAllowedCounties();
  const [receivingFacilities, setReceivingFacilities] = useState([]);
  const [beneficiary, setBeneficiary] = useState(null);
  
  // Get the current user's membership to read their scope
  const { currentMembership } = useAuth();

  const [searchParams] = useSearchParams();
  const initialPersonId = searchParams.get("person_id");

  useEffect(() => {
    if (initialPersonId) {
      mohService.victims.get(initialPersonId)
        .then((data) => setBeneficiary(data))
        .catch(() => {});
    }
  }, [initialPersonId]);

  const initialEmpty = useMemo(() => {
    return {
      ...EMPTY,
      person_ids: initialPersonId ? [Number(initialPersonId)] : [],
    };
  }, [initialPersonId]);

  const f = useMOGForm({
    resource: mohService.demandReductions,
    empty: initialEmpty,
    hydrate: (r) => ({
      ...r,
      person_ids: (r.persons ?? []).map((p) => p.id),
      receiving_facility_id:
        r.receiving_facility != null ? String(r.receiving_facility) : "",
    }),
    normalize,
    redirectAfter: (r) => `/moh/demand-reductions/${r.id}`,
  });

  useEffect(() => {
    mohService.facilities.list({ page: 1 })
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.results ?? [];
        setReceivingFacilities(list);
      })
      .catch((err) => {
        console.error("Failed to load facilities", err);
        setReceivingFacilities([]);
      });
  }, []);
  useEffect(() => {
      if (!f.isEdit && countyOptions.length === 1 && !f.form.county) {
        f.setField("county", countyOptions[0].value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countyOptions, f.isEdit]);

  // =========================================================
  // CALCULATE ALLOWED COUNTIES BASED ON SCOPE
  // =========================================================
  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    
    // If the user has no counties assigned in their scope, show all (or you can show none)
    if (assigned.length === 0) return COUNTY_OPTIONS;

    // Filter the master COUNTY_OPTIONS list to only include the assigned ones
    return COUNTY_OPTIONS.filter((opt) => {
      const countyValue = typeof opt === "string" ? opt : opt.value;
      return assigned.includes(countyValue);
    });
  }, [currentMembership]);

  const sections = useMemo(
    () => buildSections(receivingFacilities, allowedCounties),
    [receivingFacilities, allowedCounties]
  );
  // =========================================================

  return (
    <form onSubmit={f.submit} className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {f.isEdit ? "Edit demand reduction" : "New demand reduction record"}
        </h1>
      </header>

      {f.formError && (
        <div role="alert" className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
          {f.formError}
        </div>
      )}

      <section className="rounded-[--radius-box] border border-base-300 bg-base-100 p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Person covered</h2>
          <p className="mt-0.5 text-xs text-base-content/60">
            This record is being created for this specific Beneficiary.
          </p>
        </div>

        {beneficiary ? (
          <div className="flex items-center gap-4 rounded-lg border border-base-300 bg-base-50 p-4">
            {beneficiary.photo ? (
              <img src={beneficiary.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-base-300" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full bg-base-200 text-sm font-semibold text-base-content/60">
                {beneficiary.first_name?.[0]}{beneficiary.last_name?.[0]}
              </div>
            )}
            <div>
              <p className="text-base font-semibold">
                {beneficiary.first_name} {beneficiary.last_name}
              </p>
              <p className="text-sm text-base-content/60 font-mono mt-0.5">
                Beneficiary ID: {beneficiary.id}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning-content">
            <p className="text-sm">Loading beneficiary details or no ID provided...</p>
          </div>
        )}
        
        <input type="hidden" value={f.form.person_ids[0] || ""} readOnly />
      </section>

      <SchemaForm sections={sections} values={f.form} errors={f.fieldErrors} onChange={f.setField} disabled={f.submitting}/>

      <FormActions submitting={f.submitting} onCancel={() => f.navigate(-1)} submitLabel={f.isEdit ? "Save changes" : "Create record"}/>
    </form>
  );
}