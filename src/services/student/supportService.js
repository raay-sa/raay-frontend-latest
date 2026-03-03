// src/services/student/supportService.js
import http from "../http";

const StudentSupportService = {
  create: (payload) => http.post("/student/support", payload),
};

export default StudentSupportService;
