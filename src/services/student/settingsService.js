// src/services/student/settingsService.js
import http from "../http";

const StudentSettingsService = {
  // Profile
  getProfile: () => http.get("/student/profile"),
  updateProfile: (formData) => http.post("/student/profile", formData),

  // Notifications
  getNotificationSettings: () => http.get("/student/notifications_setting"),
  updateNotificationSettings: (id, formData) =>
    http.post(`/student/notifications_setting/${id}`, formData),

  // Terms
  getTerms: () => http.get("/student/privacy_terms"),
};

export default StudentSettingsService;
