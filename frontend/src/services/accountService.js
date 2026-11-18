import { apiClient } from "../api/apiClient";

export const accountService = {
  async updateAccount(payload) {
    const { data } = await apiClient.patch("/api/me/", payload);
    return data;
  },

  async updateProfile(userId, payload) {
    const { data } = await apiClient.patch(
      `/api/users/${userId}/profile/`,
      payload,
      {
        headers:
          payload instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      },
    );
    return data;
  },

  async changePassword(payload) {
    await apiClient.post("/api/change-password/", payload);
  },
};