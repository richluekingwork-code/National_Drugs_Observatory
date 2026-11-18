import { apiClient } from "../api/apiClient";

/**
 * Generic CRUD service for a DRF ModelViewSet endpoint.
 *
 * Conventions matched to the backend:
 *   - List responses are DRF-paginated: { count, next, previous, results }
 *   - Write payloads use *_id for FK fields (drug_type_id, person_id, …)
 *   - institution_id is injected by apiClient's request interceptor
 */
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

    async bulk(payload) {
      const { data } = await apiClient.post(`${endpoint}bulk/`, payload);
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
  };
}

export const ldeaService = {
  drugTypes:      createResourceService("/api/ldea/drug-types/"),
  persons:        createResourceService("/api/ldea/persons/"),
  personLookup: {
    async list({ search = "" } = {}) {
      const params = {};
      if (search) params.search = search;
      const { data } = await apiClient.get("/api/persons/lookup/", { params });
      return data;
    },
    async get(id) {
      const { data } = await apiClient.get(`/api/persons/lookup/${id}/`);
      return data;
    },
  },
  seizures:       createResourceService("/api/ldea/seizures/"),
  arrests:        createResourceService("/api/ldea/arrests/"),
  victimHistories:createResourceService("/api/ldea/victims/"),
  cases:          createResourceService("/api/ldea/cases/"),
  drugRaids:      createResourceService("/api/ldea/drug-raids/"),

  // ---- Dashboard aggregates (read-only) ----
  dashboard: {
    async hotspots({ year } = {}) {
      const { data } = await apiClient.get("/api/ldea/dashboard/hotspots/", {
        params: year ? { year } : undefined,
      });
      return data;
    },
    async traffickedDrugs({ year } = {}) {
      const { data } = await apiClient.get(
        "/api/ldea/dashboard/trafficked-drugs/",
        { params: year ? { year } : undefined },
      );
      return data;
    },
    async counts() {
      const { data } = await apiClient.get("/api/ldea/dashboard/counts/");
      return data;
    },
    // src/services/ldeaService.js — add to dashboard block
      async effectiveness({ year } = {}) {
        const { data } = await apiClient.get("/api/ldea/dashboard/effectiveness/", {
          params: year ? { year } : undefined,
        });
        return data;
      },
      async years() {
        const { data } = await apiClient.get("/api/ldea/dashboard/years/");
        return data;
      },
      async bulk(endpoint, payload) {
        const { data } = await apiClient.post(`${endpoint}bulk/`, payload);
        return data;
      },
  },


};