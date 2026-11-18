import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormSection,
  Field, SelectField, TextareaField,
} from "../../../components/ldea/fields";
import {
  FormHeader, FormErrorBanner, StickyActions, FormSpinner,
} from "../../../components/ldea/FormShell";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

const STATUS_OPTIONS = [
  { value: "planned",   label: "Planned" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPTY = {
  title: "",
  description: "",
  location: "",
  city: "",
  county: "",
  raid_date: "",
  raid_time: "",
  status: "planned",
  lead_officer: "",
  team_members: "",
  total_arrests: 0,
  total_seizures: 0,
};

export default function RaidFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.drugRaids, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.drugRaids);

  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title ?? "",
      description: existing.description ?? "",
      location: existing.location ?? "",
      city: existing.city ?? "",
      county: existing.county ?? "",
      raid_date: existing.raid_date ?? "",
      raid_time: existing.raid_time ?? "",
      status: existing.status ?? "planned",
      lead_officer: existing.lead_officer ?? "",
      team_members: existing.team_members ?? "",
      total_arrests: existing.total_arrests ?? 0,
      total_seizures: existing.total_seizures ?? 0,
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
    const result = isEdit ? await update(id, payload) : await create(payload);

    if (result.ok) {
      // FIXED: Changed to go back to the list instead of undefined ID
      navigate("/raids", { replace: true }); 
    } else {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
    }
  }

  if (isEdit && loadingRecord) return <FormSpinner />;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
      <FormHeader
        backTo={isEdit ? `/raids/${id}` : "/raids"}
        backLabel={isEdit ? "Back to raid" : "Drug raids"}
        current={isEdit ? "Edit" : "Plan raid"}
        title={isEdit ? "Edit raid" : "Plan raid"}
        subtitle="Planning, personnel, and outcome. Fields marked * are required."
      />

      <FormErrorBanner formError={formError} fieldErrors={fieldErrors} />

      <FormSection title="Planning" description="What the operation is and when it takes place.">
        <Field label="Title" name="title" required value={form.title} onChange={onChange} error={fieldErrors.title} />
        
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" name="raid_date" type="date" required value={form.raid_date} onChange={onChange} error={fieldErrors.raid_date} />
          <Field label="Time" name="raid_time" type="time" value={form.raid_time} onChange={onChange} error={fieldErrors.raid_time} />
          <Field label="City" name="city" value={form.city} onChange={onChange} error={fieldErrors.city} />
          
          <SelectField label="County" name="county" value={form.county} onChange={onChange} error={fieldErrors.county} options={COUNTY_OPTIONS} placeholder="Select county"/>
          <Field label="Full location" name="location" required value={form.location} onChange={onChange} error={fieldErrors.location} />
          <Field label="Lead officer" name="lead_officer" value={form.lead_officer} onChange={onChange} error={fieldErrors.lead_officer} placeholder="e.g. Agent John Doe"/>
          
          <Field label="Team members"  name="team_members"  value={form.team_members}  onChange={onChange}  error={fieldErrors.team_members} placeholder="e.g. Agent Smith, Agent Doe"/>
          <Field label="Total arrests" name="total_arrests" type="number" min="0" value={form.total_arrests} onChange={onChange} error={fieldErrors.total_arrests} />
          <Field label="Total seizures" name="total_seizures" type="number" min="0" value={form.total_seizures} onChange={onChange} error={fieldErrors.total_seizures} />
        </div>
        
        <TextareaField label="Description" name="description" rows={4} value={form.description} onChange={onChange} error={fieldErrors.description} />
        
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Status" name="status" required value={form.status} onChange={onChange} error={fieldErrors.status} options={STATUS_OPTIONS} />
        </div>
      </FormSection>


      <StickyActions
        submitting={submitting}
        onCancel={() => navigate(-1)}
        submitLabel={isEdit ? "Save changes" : "Save raid"}
      />
    </form>
  );
}

function normalize(form) {
  const out = { ...form };
  if (out.raid_time === "") out.raid_time = null;
  out.total_arrests = Number(out.total_arrests) || 0;
  out.total_seizures = Number(out.total_seizures) || 0;
  
  return out;
}