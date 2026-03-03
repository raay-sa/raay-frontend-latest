// src/services/registerRequestsService.js
import http from "./http";

// GET /admin/register_request?filter=&search=&page=
const RegisterRequestsService = {
  list: (params = {}) =>
    http.get("/admin/register_request", {
      params: {
        page: params.page ?? 1,
        filter: params.filter ?? "all",
        search: params.search ?? "",
      },
    }),

  // Approve: POST + _method: puttest noti
  approveTeacher: (teacherId) =>
    http.post(`/admin/register_request/teacher/${teacherId}`, {
      _method: "put",
    }),

  // Show teacher details
  showTeacher: (teacherId) => http.get(`/admin/accounts/teacher/${teacherId}`),

  // Reject / not approve
  rejectTeacher: (teacherId) =>
    http.delete(`/admin/accounts/teacher/${teacherId}`),
};

export default RegisterRequestsService;
