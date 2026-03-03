// src/services/notificationsService.js
import http from "./http";

const ENDPOINT = "/admin/notifications";

export const NotificationsService = {
  list: (params = {}) => http.get(ENDPOINT, { params }),
  create: (data) => http.post(ENDPOINT, data),
  update: (id, data) =>
    http.post(`${ENDPOINT}/${id}`, {
      ...data,
      _method: "put",
    }),
  get: (id) => http.get(`${ENDPOINT}/${id}`),
    bulkDelete: (ids = []) =>
    http.post(`/admin/notifications/multi_delete`, {
      notifications_id: ids,
    }),
};
