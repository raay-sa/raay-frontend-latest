// src/services/ordersService.js
import http from "./http";

const ENDPOINT = "/admin/orders";

export const OrdersService = {
  list: (params = {}) => http.get(ENDPOINT, { params }),
  get: (id) => http.get(`${ENDPOINT}/${id}`),
  delete: (id) => http.delete(`${ENDPOINT}/${id}`),
};
