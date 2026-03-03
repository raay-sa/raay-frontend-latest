// src/services/admin/traineesService.js
import http from "../http";

const TraineesService = {
  list: (params) => http.get("/admin/trainees", { params }),
  create: (data) => http.post("/admin/trainees", data),
  show: (id) => http.get(`/admin/trainees/${id}`),
  update: (id, data) => http.post(`/admin/trainees/${id}`, data),
  studentsList: () => http.get("/admin/students_list"),
  programsList: () => http.get("/admin/program/list"),
  getProgramStudents: (programId, params) => http.get(`/admin/program/${programId}/students`, { params }),
  getProgramReport: (programId, params) => http.get(`/admin/program/${programId}/report`, { params }),
  getExcelSheet: () =>
    http.get("/admin/trainees/excel_sheet", { responseType: "blob" }),
  
  // Send warning/alert/ban to student
  sendStudentWarning: (data) => http.post("/admin/students_warning", data),
};

export default TraineesService;
