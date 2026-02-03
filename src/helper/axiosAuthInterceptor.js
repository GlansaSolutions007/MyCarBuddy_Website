import axios from "axios";
import { refreshAccessToken } from "./authHelper";

const USER_STORAGE_KEY = "user";

function isRefreshEndpoint(config) {
  const url = config?.url || config?.baseURL || "";
  return typeof url === "string" && url.includes("Auth/refresh");
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (isRefreshEndpoint(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch (refreshErr) {
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new Event("userProfileUpdated"));
      return Promise.reject(error);
    }
  }
);
