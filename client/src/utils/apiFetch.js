const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
import { log } from "./logger";

export function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id ?? null;
  } catch {
    return null;
  }
}

export { BASE_URL };

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");


  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (refreshToken) {
    headers["x-refresh-token"] = refreshToken;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const newToken = response.headers.get("x-new-token");
  //log("Received new token from API:", newToken);
  if (newToken) {
   // log("Updating token in localStorage");
    localStorage.setItem("token", newToken);
  }

  const data = await response.json().catch(() => ({}));
  //log(`API response from ${endpoint}:`, data);

  if (data.errorType === "RELOGIN_REQUIRED") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};