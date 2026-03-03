// src/services/teacher/settingsService.js
import http from "../http";
const BASE = "/teacher";

export const TeacherSettingsService = {
  // Profile
  getProfile: () => http.get(`${BASE}/profile`),
  // Teacher update uses POST + _method=PUT, and NO id in the URL
  updateProfile: (formData) => http.post(`${BASE}/profile`, formData),

  // Notifications
  getNotificationSettings: () => http.get(`${BASE}/notifications_setting`),
  updateNotificationSettings: (id, formData) =>
    http.post(`${BASE}/notifications_setting/${id}`, formData),

  // Terms (read-only for teacher)
  getTerms: () => http.get(`${BASE}/privacy_terms`),

  // Optional: categories (if your API exposes it; safe to call/ignore)
  getCategories: () => http.get(`${BASE}/categories`),
};

export default TeacherSettingsService;
