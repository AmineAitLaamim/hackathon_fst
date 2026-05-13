import { apiClient } from "./client.js";

export async function getInvitations() {
  const response = await apiClient.get("/invitations");
  return response.data;
}

export async function updateInvitation(inviteId, status) {
  const response = await apiClient.patch(`/invitations/${inviteId}`, { status });
  return response.data;
}
