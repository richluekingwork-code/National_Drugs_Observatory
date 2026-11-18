import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormActions,
  Field, SelectField, TextareaField, PhotoField,
} from "../../../components/ldea/fields";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

const STATUS_OPTIONS = [
  { value: "stored",            label: "Stored in Evidence Room" },
  { value: "used_for_analysis", label: "Used for Analysis" },
  { value: "transferred",       label: "Transferred to Court" },
  { value: "destroyed",         label: "Destroyed" },
];

const STATUS_BADGE = {
  stored:            "badge-info",
  used_for_analysis: "badge-warning",
  transferred:       "badge-success",
  destroyed:         "badge-error",
};

// 1. FIXED: Changed drug_type_id to drug_type
const EMPTY = {
  seizure_date: "",
  seizure_time: "",
  county: "",
  district: "",
  location_description: "",
  seized_by: "",
  badge_number: "",
  drug_type: "", 
  quantity: "",
  unit: "",
  status: "stored",
  remarks: "",
};

/* ---------- Styled building blocks ---------- */

const SECTION_ICONS = {
  "Seizure Details": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
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

/* ---------- Page ---------- */

export default function SeizureFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.seizures, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.seizures);

  const [drugTypes, setDrugTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Load reference data once.
  useEffect(() => {
    ldeaService.drugTypes.list({ page: 1 }).then((d) => {
      setDrugTypes(Array.isArray(d) ? d : d.results ?? []);
    }).catch(() => {});
  }, []);

  // Prefill on edit.
  useEffect(() => {
    if (!existing) return;
    setForm({
      seizure_date: existing.seizure_date ?? "",
      seizure_time: existing.seizure_time ?? "",
      county: existing.county ?? "",
      district: existing.district ?? "",
      location_description: existing.location_description ?? "",
      seized_by: existing.seized_by ?? "",
      badge_number: existing.badge_number ?? "",
      drug_type: existing.drug_type ?? "", // 2. FIXED: Use string directly
      quantity: existing.quantity ?? "",
      unit: existing.unit ?? "",
      status: existing.status ?? "stored",
      remarks: existing.remarks ?? "",
    });
  }, [existing]);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
      navigate(`/seizures`, { replace: true });
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

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === form.status)?.label ?? "Stored in Evidence Room";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Sticky page header */}
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
                {isEdit ? "Edit seizure" : "Log seizure"}
              </h1>
              <p className="text-xs sm:text-sm text-base-content/55 truncate">
                {isEdit ? "Update where, when, and what was seized." : "Record where, when, and what was seized."}
              </p>
            </div>
          </div>
          <span className={`badge badge-lg badge-soft shrink-0 ${STATUS_BADGE[form.status] ?? "badge-info"}`}>
            {statusLabel}
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

      {/* ALL FIELDS TOGETHER IN ONE SECTION */}
      <Section number={1} title="Seizure Details" description="Record the date, location, officer, and substance details.">
        
        {/* Row 1: Date, Time, County */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Seizure date" name="seizure_date" type="date" required value={form.seizure_date} onChange={onChange} error={fieldErrors.seizure_date} />
          <Field label="Seizure time" name="seizure_time" type="time" value={form.seizure_time} onChange={onChange} error={fieldErrors.seizure_time} />
          <SelectField label="County" name="county" value={form.county} onChange={onChange} error={fieldErrors.county} options={COUNTY_OPTIONS} placeholder="Select county" />
        </div>

        {/* Row 2: District, Officer Name, Badge */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="District" name="district" value={form.district} onChange={onChange} error={fieldErrors.district} />
          <Field label="Officer name" name="seized_by" required value={form.seized_by} onChange={onChange} error={fieldErrors.seized_by} />
          <Field label="Badge number" name="badge_number" value={form.badge_number} onChange={onChange} error={fieldErrors.badge_number} />
        </div>

        <TextareaField label="Location description" name="location_description" value={form.location_description} onChange={onChange} error={fieldErrors.location_description} />

        {/* Row 3: Drug Type, Quantity, Unit */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 3. FIXED: name is drug_type, value is d.name */}
          <SelectField 
            label="Drug type" 
            name="drug_type" 
            value={form.drug_type} 
            onChange={onChange} 
            error={fieldErrors.drug_type} 
            options={drugTypes.map((d) => ({ value: d.name, label: d.name }))} 
            placeholder="Select drug type" 
          />
          <Field label="Quantity" name="quantity" type="number" step="0.01" min="0" value={form.quantity} onChange={onChange} error={fieldErrors.quantity} />
          <Field label="Unit" name="unit" value={form.unit} onChange={onChange} error={fieldErrors.unit} hint="g, pills, oz" />
        </div>

        {/* Row 4: Status & Photo */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Status" name="status" value={form.status} onChange={onChange} error={fieldErrors.status} options={STATUS_OPTIONS} placeholder="Select status" />
          <div className="pt-1">
            <PhotoField label="Photo" name="photo" currentUrl={existing?.photo} error={fieldErrors.photo} onChange={setPhoto} />
          </div>
        </div>

        <TextareaField label="Remarks" name="remarks" value={form.remarks} onChange={onChange} error={fieldErrors.remarks} />
      
      </Section>

      {/* Sticky action bar */}
      <div className="sticky bottom-3 z-20">
        <div className="card bg-base-100/90 backdrop-blur-md border border-base-300/70 shadow-lg">
          <div className="card-body p-3 sm:px-4 flex-row items-center justify-between gap-3">
            <p className="hidden sm:block text-xs text-base-content/50">
              <span className="text-error">*</span> Required fields
            </p>
            <FormActions
              submitting={submitting}
              onCancel={() => navigate(-1)}
              submitLabel={isEdit ? "Save changes" : "Log seizure"}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

// ---- helpers ----

function normalize(form) {
  const out = { ...form };
  // 4. FIXED: Removed drug_type_id from this loop
  for (const k of ["quantity", "seizure_time"]) {
    if (out[k] === "") out[k] = null;
  }
  if (out.quantity !== null) out.quantity = Number(out.quantity);
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