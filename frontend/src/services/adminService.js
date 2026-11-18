import { apiClient } from "../api/apiClient";

export const adminService = {
  // ---- Users ----
  async listUsers({ page = 1, search = "", institutionId = null } = {}) {
    const params = { page };
    if (search) params.search = search;
    if (institutionId) params.institution = institutionId;
    const { data } = await apiClient.get("/api/users/", { params });
    return data; // { count, next, previous, results }
  },

  async createUser(payload) {
    const { data } = await apiClient.post("/api/users/", payload);
    return data;
  },

  async updateUser(id, payload) {
    const { data } = await apiClient.patch(`/api/users/${id}/`, payload);
    return data;
  },

  // Activate or deactivate (soft delete). Backend scopes this to the admin's institution.
  async setUserActive(id, isActive) {
    const { data } = await apiClient.patch(`/api/users/${id}/`, { is_active: isActive });
    return data;
  },

  async deactivateUser(id) {
    await apiClient.patch(`/api/users/${id}/`, { is_active: false });
  },

  // ---- Institutions ----
  async createInstitution(payload) {
    const { data } = await apiClient.post("/api/institutions/", payload);
    return data;
  },

  async updateInstitution(id, payload) {
    const { data } = await apiClient.patch(`/api/institutions/${id}/`, payload);
    return data;
  },

  async seedInstitutions() {
    const { data } = await apiClient.post("/api/institutions/seed/");
    return data;
  },

  async listInstitutions() {
    const { data } = await apiClient.get("/api/institutions/");
    return Array.isArray(data) ? data : data?.results ?? [];
  },

  // ---- Memberships ----
  async listMemberships({ page = 1, search = "", institutionId = null } = {}) {
    const params = { page };
    if (search) params.search = search;
    if (institutionId) params.institution = institutionId;
    const { data } = await apiClient.get("/api/memberships/", { params });
    return data;
  },

  async createMembership({ user_id, institution_code, role }) {
    const { data } = await apiClient.post("/api/memberships/", {
      user_id,
      institution_code,
      role,
    });
    return data;
  },

  async updateMembership(id, payload) {
    const { data } = await apiClient.patch(`/api/memberships/${id}/`, payload);
    return data;
  },

  // ---- Audit Logs ----
  async listAuditLogs({ page = 1, search = "", action = "", institutionId = null } = {}) {
    const params = { page };
    if (search) params.search = search;
    if (action) params.action = action;
    // Only honored for superusers; ignored for institution admins.
    if (institutionId) params.institution = institutionId;
    const { data } = await apiClient.get("/api/audit-logs/", { params });
    return data;
  },

  // ---- Dashboards ----
  async getInstitutionDashboard(institutionId = null) {
    const params = {};
    if (institutionId) params.institution_id = institutionId; // apiClient also appends the active one
    const { data } = await apiClient.get("/api/admin/institution-dashboard/", { params });
    return data;
  },
};