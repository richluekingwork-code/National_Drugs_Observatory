import { useState } from "react";

const FALLBACK = "We couldn't save your changes. Please try again.";

// Turns a DRF error response into per-field messages plus one general message.
export function parseError(err, fields) {
  const data = err?.response?.data;
  const fieldErrors = {};
  let general = FALLBACK;

  if (data && typeof data === "object") {
    for (const key of fields) {
      const value = data[key];
      if (value) fieldErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }

    if (typeof data.detail === "string") {
      general = data.detail;
    } else if (Object.keys(fieldErrors).length) {
      general = "Please fix the highlighted fields.";
    } else {
      const first = Object.values(data).flat()[0];
      if (typeof first === "string") general = first;
    }
  }

  return { fieldErrors, general };
}

/**
 * Shared state for "edit a few fields and save" forms:
 * dirty tracking, discard, per-field server errors, status messages.
 */
export function useSaveForm({ initial, fields, save, successMessage, onSaved }) {
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const dirty = fields.some((key) => form[key] !== saved[key]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setMessage(null);
    setError(null);
    setFieldErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  }

  function onChange(e) {
    setField(e.target.name, e.target.value);
  }

  function reset() {
    setForm(saved);
    setMessage(null);
    setError(null);
    setFieldErrors({});
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting || !dirty) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      await save(form);
      setSaved(form);
      setMessage(successMessage);
      onSaved?.();
    } catch (err) {
      const parsed = parseError(err, fields);
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.general);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    dirty,
    submitting,
    message,
    error,
    fieldErrors,
    setField,
    onChange,
    reset,
    onSubmit,
  };
}