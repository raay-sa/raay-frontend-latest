import axios from "axios";
import authService from "./authService";

// If you're running `vite` (dev), we'll hit /api so the Vite proxy handles CORS.
// In production builds, hit the real backend (VITE_BASE_URL + /api) or use VITE_API_BASE_URL if you prefer.
const isDev = import.meta.env.DEV;
const rawBackend = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const explicitApi = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

// Decide baseURL: dev -> /api (proxied), prod -> explicitApi or backend + /api
const baseURL = isDev
  ? "/api"
  : explicitApi || (rawBackend ? `${rawBackend}/api` : "");

const http = axios.create({
  baseURL,
  // Set to true only if you rely on cookies/sessions and have server-side CORS for credentials.
  withCredentials: false,
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

/* ── attach token ───────────────────────────── */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── global 401 handler with token refresh ─────────────────────── */
http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        try {
          console.log("Attempting to refresh token...");
          const response = await authService.refreshToken(refreshToken);
          const newToken = response.data.access_token;
          
          if (newToken) {
            console.log("Token refreshed successfully");
            localStorage.setItem("token", newToken);
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Process queued requests
            processQueue(null, newToken);
            
            // Retry the original request
            return http(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          processQueue(refreshError, null);
          
          // Clear invalid tokens and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("type");
          window.location = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, redirect to login
        console.log("No refresh token available, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("type");
        window.location = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default http;
