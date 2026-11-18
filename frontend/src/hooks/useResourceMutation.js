import { useCallback, useState } from "react";

/**
 * Normalizes DRF error responses into { fieldErrors, formError }.
 * Handles both ValidationError (field-keyed dict) and single-message
 * errors ({"detail": "…"} or {"non_field_errors": ["…"]}).
 */
function normalizeError(err) {
  const body = err?.response?.data;
  if (!body || typeof body !== "object") {
    return { fieldErrors: {}, formError: "Something went wrong." };
  }
  const fieldErrors = {};
  let formError = null;
  for (const [key, value] of Object.entries(body)) {
    const msg = Array.isArray(value) ? value[0] : String(value);
    if (key === "detail" || key === "non_field_errors") formError = msg;
    else fieldErrors[key] = msg;
  }
  return { fieldErrors, formError };
}

export function useResourceMutation(resource) {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(async (fn) => {
    setSubmitting(true);
    try {
      return { ok: true, data: await fn() };
    } catch (err) {
      return { ok: false, ...normalizeError(err) };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    create: (payload) => run(() => resource.create(payload)),
    update: (id, payload) => run(() => resource.update(id, payload)),
    remove: (id) => run(() => resource.remove(id)),
  };
}