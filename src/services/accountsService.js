// src/services/accountsService.js
import http from "./http";

const ENDPOINT = "/admin/accounts";

export const AccountsService = {
  list: (params) => http.get("/admin/accounts", { params }),

  // ---------- Students ----------
  createStudent: (data) => http.post(`${ENDPOINT}/student`, data),

  importStudentsSheet: (file, fieldName = "file") => {
    const fd = new FormData();
    fd.append(fieldName, file);
    return http.post(`${ENDPOINT}/student`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateStudent: (id, data) =>
    http.post(`${ENDPOINT}/student/${id}`, {
      ...data,
      _method: "PUT",
    }),
  getStudent: (id) => http.get(`${ENDPOINT}/student/${id}`),
  deleteStudent: (id) => http.delete(`${ENDPOINT}/student/${id}`),

  exportStudents: () =>
    http.get(`${ENDPOINT}/student/download`, { responseType: "blob" }),

  getStudentExcelExample: () =>
    http.get(`${ENDPOINT}/student/excel_sheet`, { responseType: "blob" }),

  // ---------- Teachers ----------
  createTeacher: (data) => http.post(`${ENDPOINT}/teacher`, data),

  importTeachersSheet: (file, fieldName = "file") => {
    const fd = new FormData();
    fd.append(fieldName, file);
    return http.post(`${ENDPOINT}/teacher`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateTeacher: (id, data) =>
    http.post(`${ENDPOINT}/teacher/${id}`, {
      ...data,
      _method: "PUT",
    }),
  getTeacher: (id) => http.get(`${ENDPOINT}/teacher/${id}`),
  deleteTeacher: (id) => http.delete(`${ENDPOINT}/teacher/${id}`),

  exportTeachers: () =>
    http.get(`${ENDPOINT}/teacher/download`, { responseType: "blob" }),


  getTeacherExcelExample: () =>
    http.get(`${ENDPOINT}/teacher/excel_sheet`, { responseType: "blob" }),

  // ---------- Shared ----------
  fetchCategories: () => http.get("/admin/categories"),

  exportTransactions: () =>
    http.get(`${ENDPOINT}/transaction/download`, { responseType: "blob" }),
};
