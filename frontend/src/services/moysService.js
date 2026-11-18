// frontend/src/services/moysService.js
import { apiClient } from "../api/apiClient";

const unwrap = (p) => p.then((r) => r.data);

// Strip the client-only `person_id` field before PATCH.
// - Plain objects: remove `person_id` from a shallow copy.
// - FormData: delete the `person_id` entry in place and return the same FormData
//   (spreading a FormData with `{ ...fd }` would produce `{}` and silently
//   discard the whole payload — that was the bug preventing edits from saving).
const stripId = (d) => {
  if (d instanceof FormData) {
    if (d.has("person_id")) d.delete("person_id");
    return d;
  }
  if (d && typeof d === "object") {
    const { person_id, ...rest } = d;
    return rest;
  }
  return d;
};

// Content-type hint for multipart PATCH/POST (axios auto-sets the boundary,
// but being explicit avoids some proxies stripping it).
const multipartHeaders = (d) =>
  d instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;

export const moysService = {
  // LDEA Persons (read-only dashboard view)
  persons: (params) => unwrap(apiClient.get(`/api/moys/dashboard/persons/`, { params })),
  person:  (uuid)   => unwrap(apiClient.get(`/api/moys/dashboard/person/${uuid}/`)),

  // MOYS Records
  referrals: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/referrals/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/referrals/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/referrals/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/referrals/${id}/`)),
  },
  receipts: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/receipts/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/receipts/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/receipts/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/receipts/${id}/`)),
  },
  preTreatment: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/pre-treatment/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/pre-treatment/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/pre-treatment/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/pre-treatment/${id}/`)),
  },
  aryep: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/aryep-registrations/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/aryep-registrations/", d)),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/aryep-registrations/${id}/`, stripId(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/aryep-registrations/${id}/`)),
  },
  plans: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/reintegration-plans/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/reintegration-plans/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/reintegration-plans/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/reintegration-plans/${id}/`)),
  },
  tvet: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/tvet/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/tvet/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/tvet/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/tvet/${id}/`)),
  },
  interventions: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/youth-interventions/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/youth-interventions/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/youth-interventions/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/youth-interventions/${id}/`)),
  },
  employment: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/employment-business/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/employment-business/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/employment-business/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/employment-business/${id}/`)),
  },
  familyReintegration: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/family-reintegration/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/family-reintegration/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/family-reintegration/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/family-reintegration/${id}/`)),
  },
  followUps: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/follow-ups/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/follow-ups/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/follow-ups/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/follow-ups/${id}/`)),
  },
  caseClosures: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/case-closures/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/case-closures/", d, multipartHeaders(d))),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/case-closures/${id}/`, stripId(d), multipartHeaders(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/case-closures/${id}/`)),
  },

  serviceProviders: {
    list:   (p)     => unwrap(apiClient.get("/api/moys/service-providers/", { params: p })),
    create: (d)     => unwrap(apiClient.post("/api/moys/service-providers/", d)),
    update: (id, d) => unwrap(apiClient.patch(`/api/moys/service-providers/${id}/`, stripId(d))),
    remove: (id)    => unwrap(apiClient.delete(`/api/moys/service-providers/${id}/`)),
  },
};