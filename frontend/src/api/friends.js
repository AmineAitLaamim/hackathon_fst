import { apiClient } from "./client.js";

export async function getFriends() {
  const response = await apiClient.get("/friends");
  return response.data;
}

export async function getFriendRequests(type) {
  const response = await apiClient.get("/friends/requests", { params: { type } });
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await apiClient.post("/friends/request", { user_id: userId });
  return response.data;
}

export async function respondToFriendRequest(id, status) {
  const response = await apiClient.patch(`/friends/${id}/respond`, { status });
  return response.data;
}

export async function removeFriend(id) {
  const response = await apiClient.delete(`/friends/${id}`);
  return response.data;
}
