import { apiClient } from "../api/apiClient";

export const mojService = {
  cases: {
    list: (params) => apiClient.get("/api/moj/cases/", { params }),
    get: (id) => apiClient.get(`/api/moj/cases/${id}/`),
  },
  assignments: {
    list: (params) => apiClient.get("/api/moj/assignments/", { params }),
    create: (data) => apiClient.post("/api/moj/assignments/", data),
  },
  seizures: {
    list: (params) => apiClient.get("/api/ldea/seizures/", { params }),
  },
  legalReviews: {
    list: (params) => apiClient.get("/api/moj/legal-reviews/", { params }),
    create: (data) => apiClient.post("/api/moj/legal-reviews/", data),
  },
  infoRequests: {
    list: (params) => apiClient.get("/api/moj/info-requests/", { params }),
    create: (data) => apiClient.post("/api/moj/info-requests/", data),
  },
  courtCases: {
    list: (params) => apiClient.get("/api/moj/court-cases/", { params }),
    create: (data) => apiClient.post("/api/moj/court-cases/", data),
  },
  hearings: {
    list: (params) => apiClient.get("/api/moj/hearings/", { params }),
    create: (data) => apiClient.post("/api/moj/hearings/", data),
  },
  orders: {
    list: (params) => apiClient.get("/api/moj/orders/", { params }),
    create: (data) => apiClient.post("/api/moj/orders/", data),
  },
  fines: {
    list: (params) => apiClient.get("/api/moj/fines/", { params }),
    create: (data) => apiClient.post("/api/moj/fines/", data),
  },
  payments: {
    list: (params) => apiClient.get("/api/moj/payments/", { params }),
    create: (data) => apiClient.post("/api/moj/payments/", data),
  },
  appeals: {
    list: (params) => apiClient.get("/api/moj/appeals/", { params }),
    create: (data) => apiClient.post("/api/moj/appeals/", data),
  },
  // NEW: Endpoint to fetch the list of prosecutors
  prosecutors: {
    list: () => apiClient.get("/api/moj/prosecutors/"),
  },
};