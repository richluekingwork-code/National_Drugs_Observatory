// frontend/src/services/mogService.js
import { apiClient } from "../api/apiClient";

const unwrap = (p) => p.then((r) => r.data);

// Helper to strip person_id from updates (fixes "may not be null" error)
const stripId = (d) => {
  const { person_id, ...rest } = d;
  return rest;
};

export const mogService = {
  childTracking: {
    list: (p) => unwrap(apiClient.get("/api/mog/child-tracking/", { params: p })),
    create: (d) => unwrap(apiClient.post("/api/mog/child-tracking/", d)),
    update: (id, d) => unwrap(apiClient.patch(`/api/mog/child-tracking/${id}/`, d)),
    remove: (id) => unwrap(apiClient.delete(`/api/mog/child-tracking/${id}/`)),
  },
  person:  (uuid)   => unwrap(apiClient.get(`/api/mog/dashboard/person/${uuid}/`)),
  persons: (params) => unwrap(apiClient.get(`/api/mog/dashboard/persons/`, { params })),
  people:  ()       => unwrap(apiClient.get(`/api/mog/dashboard/people/`)),

  dashboard: {
    kpis:              (p) => unwrap(apiClient.get(`/api/mog/dashboard/kpis/`,                { params: p })),
    caseloadsByCounty: (p) => unwrap(apiClient.get(`/api/mog/dashboard/caseloads-by-county/`, { params: p })),
    reunificationRate: (p) => unwrap(apiClient.get(`/api/mog/dashboard/reunification-rate/`,  { params: p })),
    timeToClosure:     (p) => unwrap(apiClient.get(`/api/mog/dashboard/time-to-closure/`,     { params: p })),
    activityTrends:    (p) => unwrap(apiClient.get(`/api/mog/dashboard/activity-trends/`,     { params: p })),
    years:             ()  => unwrap(apiClient.get(`/api/mog/dashboard/years/`)),
  },

  assessments: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/assessments/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/assessments/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/assessments/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/assessments/${id}/`)),
  },
  followups: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/followups/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/followups/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/followups/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/followups/${id}/`)),
  },
  tracings: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/tracings/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/tracings/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/tracings/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/tracings/${id}/`)),
  },
  verifications: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/verifications/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/verifications/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/verifications/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/verifications/${id}/`)),
  },
  handovers: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/handovers/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/handovers/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/handovers/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/handovers/${id}/`)),
  },
  tracingActions: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/tracing-actions/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/tracing-actions/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/tracing-actions/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/tracing-actions/${id}/`)),
  },
  outreach: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/outreach/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/outreach/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/outreach/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/outreach/${id}/`)),
  },
  caseClosures: {
    list:   (p)    => unwrap(apiClient.get("/api/mog/case-closures/", { params: p })),
    create: (d)    => unwrap(apiClient.post("/api/mog/case-closures/", d)),
    update: (id, d)=> unwrap(apiClient.patch(`/api/mog/case-closures/${id}/`, stripId(d))),
    remove: (id)   => unwrap(apiClient.delete(`/api/mog/case-closures/${id}/`)),
  },
};