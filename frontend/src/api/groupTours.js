import { apiClient } from "./client.js";

export async function getGroupTours() {
  const response = await apiClient.get("/group-tours");
  return response.data;
}

export async function createGroupTour(tourId) {
  const response = await apiClient.post("/group-tours", { tour_id: tourId });
  return response.data;
}

export async function getGroupTour(id) {
  const response = await apiClient.get(`/group-tours/${id}`);
  return response.data;
}

export async function deleteGroupTour(id) {
  const response = await apiClient.delete(`/group-tours/${id}`);
  return response.data;
}

export async function inviteToGroupTour(id, friendIds) {
  const response = await apiClient.post(`/group-tours/${id}/invite`, { friend_ids: friendIds });
  return response.data;
}

export async function joinGroupTour(id) {
  const response = await apiClient.post(`/group-tours/${id}/join`);
  return response.data;
}

export async function leaveGroupTour(id) {
  const response = await apiClient.post(`/group-tours/${id}/leave`);
  return response.data;
}

export async function getGroupTourActivity(id) {
  const response = await apiClient.get(`/group-tours/${id}/activity`);
  return response.data;
}

export async function checkInStop(groupId, stopId) {
  const response = await apiClient.post(`/group-tours/${groupId}/stops/${stopId}/checkin`);
  return response.data;
}

export async function postStopComment(groupId, stopId, text) {
  const response = await apiClient.post(`/group-tours/${groupId}/stops/${stopId}/comments`, { text });
  return response.data;
}

export async function deleteStopComment(groupId, stopId, commentId) {
  const response = await apiClient.delete(`/group-tours/${groupId}/stops/${stopId}/comments/${commentId}`);
  return response.data;
}
