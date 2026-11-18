import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";
import {
  FormSection, FormActions,
  Field, SelectField, TextareaField,
} from "../../../components/ldea/fields";
import { ParticipantsEditor } from "../../../components/ldea/ParticipantsEditor";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";
import { COUNTY_OPTIONS } from "../../../constants/counties"; // <--- ADDED

const STATUS_OPTIONS = [
  { value: "pending",       label: "Pending at MOJ" },
  { value: "investigation", label: "Under investigation" },
  { value: "closed",        label: "Closed" },
];

const EMPTY = {
  case_number: "",
  title: "",
  description: "",
  court_name: "",
  county: "",
  substance: "",
  action_taken: "",
  charge: "",
  status: "pending",
  participants: [],
};

export default function CaseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.cases, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.cases);

  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!existing) return;
    setForm({
      case_number: existing.case_number ?? "",
      title: existing.title ?? "",
      description: existing.description ?? "",
      court_name: existing.court_name ?? "",
      county: existing.county ?? "",
      substance: existing.substance ?? "",
      action_taken: existing.action_taken ?? "",
      charge: existing.charge ?? "",
      status: existing.status ?? "pending",
      // FIXED: Changed p.person.id to p.person_arrested?.id
      participants: (existing.participants ?? []).map((p) => ({
        person_id: p.person_arrested?.id, 
        role: p.role,
        is_primary: p.is_primary,
      })),
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
      navigate(`/cases`, { replace: true }); // FIXED: Redirect to list
    } else {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (isEdit && loadingRecord) {
    return (
      <div className="grid place-items-center py-24">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  const errorCount = Object.keys(fieldErrors ?? {}).length;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb + title */}
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-base-content/60" aria-label="Breadcrumb">
          <Link
            to={isEdit ? `/cases/${id}` : "/cases"}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-base-200 hover:text-base-content"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {isEdit ? "Back to case" : "Cases"}
          </Link>
          <ChevronRight className="size-3.5 text-base-content/30" aria-hidden="true" />
          <span className="font-medium text-base-content">{isEdit ? "Edit" : "New case"}</span>
        </nav>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit case" : "Create case"}
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Record the case file, the charges, and the people involved. Fields marked * are required.
        </p>
      </div>

      {(formError || errorCount > 0) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">{formError || "Some fields need your attention."}</p>
            {errorCount > 0 && (
              <p className="mt-0.5 text-xs text-error/80">
                Fix the highlighted {errorCount === 1 ? "field" : `${errorCount} fields`} and save again.
              </p>
            )}
          </div>
        </div>
      )}

      <FormSection title="Case details" description="How the case is identified and where it is being heard.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Case number" name="case_number" required value={form.case_number} onChange={onChange} error={fieldErrors.case_number} hint="e.g. LDEA/2026/042" />
          <Field label="Court" name="court_name" value={form.court_name} onChange={onChange} error={fieldErrors.court_name} />
        </div>
        <Field label="Title" name="title" required value={form.title} onChange={onChange} error={fieldErrors.title} />
        <TextareaField label="Description" name="description" rows={4} value={form.description} onChange={onChange} error={fieldErrors.description} />
      </FormSection>

      <FormSection title="Charges & substance" description="What the case is about and where it stands.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Charge" name="charge" value={form.charge} onChange={onChange} error={fieldErrors.charge} />
          <Field label="Substance" name="substance" value={form.substance} onChange={onChange} error={fieldErrors.substance} />
        </div>
        <Field label="Action taken" name="action_taken" value={form.action_taken} onChange={onChange} error={fieldErrors.action_taken} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Status" name="status" required value={form.status} onChange={onChange} error={fieldErrors.status} options={STATUS_OPTIONS} />
          
          {/* FIXED: Changed from Field to SelectField */}
          <SelectField 
            label="County" 
            name="county" 
            value={form.county} 
            onChange={onChange} 
            error={fieldErrors.county} 
            options={COUNTY_OPTIONS} 
            placeholder="Select county" 
          />
        </div>
      </FormSection>

      <FormSection
        title="Participants"
        description={
          form.participants.length
            ? `${form.participants.length} linked to this case.`
            : "Link the suspects, victims, and witnesses involved."
        }
      >
        <ParticipantsEditor
          value={form.participants}
          onChange={(participants) => setForm((f) => ({ ...f, participants }))}
          error={fieldErrors.participants}
        />
      </FormSection>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 rounded-2xl border border-base-300 bg-base-100/90 px-4 py-3 shadow-lg backdrop-blur">
        <FormActions
          submitting={submitting}
          onCancel={() => navigate(-1)}
          submitLabel={isEdit ? "Save changes" : "Create case"}
        />
      </div>
    </form>
  );
}

function normalize(form) {
  return {
    ...form,
    participants: form.participants
      .filter((p) => p.person_id)
      .map((p) => ({
        person_id: Number(p.person_id),
        role: p.role,
        is_primary: Boolean(p.is_primary),
      })),
  };
}