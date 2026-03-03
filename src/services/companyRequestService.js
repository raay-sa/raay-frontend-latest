// src/services/companyRequestService.js
import http from "./http";

const ENDPOINT = "/admin/company_request";

export const CompanyRequestService = {
  list: (params) => http.get(ENDPOINT, { params }),
  show: (id) => http.get(`${ENDPOINT}/${id}`),
  updateStatus: (id, status) =>
    http.post(`${ENDPOINT}/${id}`, { _method: "PUT", status }),
  delete: (id) => http.delete(`${ENDPOINT}/${id}`),
};
