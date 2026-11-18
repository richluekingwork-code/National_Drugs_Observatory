import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useResource } from "../../hooks/useResource";
import { useResourceMutation } from "../../hooks/useResourceMutation";

/**
 * @param {object} resource       mogService.<name>
 * @param {object} empty          initial empty form
 * @param {function} hydrate      (existingRecord) => formValues
 * @param {function} normalize    (formValues) => payload
 * @param {string} redirectAfter  (recordId) => path
 */
export function useMOGForm({ resource, empty, hydrate, normalize, redirectAfter }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const { data: existing, loading: loadingRecord } = useResource(resource, id);
  const { create, update, submitting } = useResourceMutation(resource);

  const [form, setForm] = useState(() => {
    // Allow query params to prefill for the "new" flow.
    const initial = { ...empty };
    search.forEach((value, key) => {
      if (key in initial) initial[key] = value;
    });
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (existing && hydrate) setForm(hydrate(existing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const payload = normalize ? normalize(form) : form;
    const result = isEdit ? await update(id, payload) : await create(payload);

    if (result.ok) {
      navigate(redirectAfter(result.data), { replace: true });
    } else {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError ?? "Could not save.");
    }
    return result;
  }

  return {
    id, isEdit, form, setForm, setField,
    fieldErrors, formError,
    submitting, loading: loadingRecord,
    submit, navigate, existing,
  };
}