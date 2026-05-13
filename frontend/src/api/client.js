import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "../features/auth/tokenStore.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;
let onSessionExpired = null;

export function registerSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (status !== 401 || originalRequest?._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        apiClient.post("/auth/refresh").then((response) => {
          const token = response.data?.access || response.data?.access_token;
          if (!token) {
            throw new Error("Refresh response did not include an access token.");
          }
          setAccessToken(token);
          return token;
        });

      const token = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      onSessionExpired?.();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);
