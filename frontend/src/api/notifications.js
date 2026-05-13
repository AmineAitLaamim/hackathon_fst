import { apiClient } from "./client.js";

export async function getNotifications(page = 1) {
  const response = await apiClient.get("/notifications", { params: { page } });
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.post(`/notifications/${id}/read`);
  return response.data;
}
