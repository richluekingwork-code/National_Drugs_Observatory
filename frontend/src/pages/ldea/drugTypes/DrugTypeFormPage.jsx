import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormActions,
  Field, TextareaField, PhotoField,
} from "../../../components/ldea/fields";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { ldeaService } from "../../../services/ldeaService";

const EMPTY = {
  name: "",
  category: "",
  common_units: "",
  description: "",
};

/* ---------- Styled building blocks ---------- */

const SECTION_ICONS = {
  Identification: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
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

/* ---------- Page ---------- */

export default function DrugTypeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, loading: loadingRecord } = useResource(ldeaService.drugTypes, id);
  const { create, update, submitting } = useResourceMutation(ldeaService.drugTypes);

  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name ?? "",
      category: existing.category ?? "",
      common_units: existing.common_units ?? "",
      description: existing.description ?? "",
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

    const body = photo ? toFormData(form, photo) : form;
    const result = isEdit ? await update(id, body) : await create(body);

    if (result.ok) {
      navigate("/drug-types", { replace: true });
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
                {isEdit ? "Edit drug type" : "New drug type"}
              </h1>
              <p className="text-xs sm:text-sm text-base-content/55 truncate">
                Reference record used when logging seizures, evidence, and cases.
              </p>
            </div>
          </div>
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

      <Section number={1} title="Identification" description="Name, category and how it is usually measured.">
        <Field label="Name" name="name" required value={form.name} onChange={onChange} error={fieldErrors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" name="category" value={form.category} onChange={onChange} error={fieldErrors.category} hint="e.g. Narcotic, Stimulant, Depressant" />
          <Field label="Common units" name="common_units" value={form.common_units} onChange={onChange} error={fieldErrors.common_units} hint="e.g. grams, pills, ounces" />
        </div>
        <TextareaField label="Description" name="description" value={form.description} onChange={onChange} error={fieldErrors.description} />
      </Section>

      <Section number={2} title="Photo" description="Reference image for identification purposes.">
        <PhotoField
          label="Reference photo"
          name="photo"
          currentUrl={existing?.photo}
          error={fieldErrors.photo}
          onChange={setPhoto}
        />
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
              submitLabel={isEdit ? "Save changes" : "Create drug type"}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function toFormData(payload, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined) fd.append(k, v);
  }
  fd.append("photo", file);
  return fd;
}