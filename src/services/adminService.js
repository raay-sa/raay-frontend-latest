import http from "./http";

const ENDPOINT = "/admin";

export const AdminService = {
  getProfile: () => http.get(`${ENDPOINT}/profile`),
  updateProfile: (id, data) => http.post(`${ENDPOINT}/profile/${id}`, data),
  getNotificationSettings: () => http.get(`${ENDPOINT}/notifications_setting`),
  updateNotificationSettings: (id, data) =>
    http.post(`${ENDPOINT}/notifications_setting/${id}`, data),
  getSettings: () => http.get(`${ENDPOINT}/settings`),
  updateSettings: (data) => http.post(`${ENDPOINT}/settings`, data),
  getSystemSettings: () => http.get(`/system-settings`),
  updateSystemSettings: (data) => http.post(`/system-settings`, data),
};
 