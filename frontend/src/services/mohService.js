import { apiClient } from "../api/apiClient";

function createResourceService(endpoint) {
  return {
    async list({ page = 1, search = "", ordering, ...filters } = {}) {
      const params = { page };
      if (search) params.search = search;
      if (ordering) params.ordering = ordering;
      for (const [k, v] of Object.entries(filters)) {
        if (v !== "" && v !== null && v !== undefined) params[k] = v;
      }
      const { data } = await apiClient.get(endpoint, { params });
      return Array.isArray(data) ? data : (data.results || []);
    },
    async get(id) {
      const { data } = await apiClient.get(`${endpoint}${id}/`);
      return data;
    },
    async create(payload) {
      const { data } = await apiClient.post(endpoint, payload);
      return data;
    },
    async update(id, payload) {
      const { data } = await apiClient.patch(`${endpoint}${id}/`, payload);
      return data;
    },
    async remove(id) {
      await apiClient.delete(`${endpoint}${id}/`);
    },
    async bulk(payload) {
      const { data } = await apiClient.post(`${endpoint}bulk/`, payload);
      return data;
    },
  };
}

export const mohService = {
  // LDEA Victims directory (read-only for MOH)
  victims: createResourceService("/api/moh/victims/"),

  // Standard MOH resources
  demandReductions: createResourceService("/api/moh/demand-reductions/"),
  prevention:       createResourceService("/api/moh/prevention/"),
  facilities:       createResourceService("/api/moh/treatment-facilities/"),

  // Dashboard aggregations
  dashboard: {
    async kpis({ year } = {}) {
      const { data } = await apiClient.get("/api/moh/dashboard/kpis/", {
        params: year ? { year } : undefined,
      });
      return data;
    },
    async admissionsByCounty({ year } = {}) {
      const { data } = await apiClient.get(
        "/api/moh/dashboard/admissions-by-county/",
        { params: year ? { year } : undefined },
      );
      return data;
    },
    async admissionsTrend({ year } = {}) {
      const { data } = await apiClient.get(
        "/api/moh/dashboard/admissions-trend/",
        { params: year ? { year } : undefined },
      );
      return data;
    },
    async bedUtilization() {
      const { data } = await apiClient.get(
        "/api/moh/dashboard/bed-utilization/",
      );
      return data;
    },
    async preventionReach({ year } = {}) {
      const { data } = await apiClient.get(
        "/api/moh/dashboard/prevention-reach/",
        { params: year ? { year } : undefined },
      );
      return data;
    },
    async years() {
      const { data } = await apiClient.get("/api/moh/dashboard/years/");
      return data;
    },
  },

  // Referral actions
  referrals: {
    async incoming({ page = 1 } = {}) {
      const { data } = await apiClient.get(
        "/api/moh/demand-reductions/incoming-referrals/",
        { params: { page } },
      );
      return data;
    },
    async accept(id) {
      const { data } = await apiClient.post(
        `/api/moh/demand-reductions/${id}/accept/`,
      );
      return data;
    },
    async decline(id, reason = "") {
      const { data } = await apiClient.post(
        `/api/moh/demand-reductions/${id}/decline/`,
        { reason },
      );
      return data;
    },
  },
};