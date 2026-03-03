// src/services/commonQuestionsService.js
import http from "./http";

const ENDPOINTS = {
  student: "/student/common_questions",
  teacher: "/teacher/common_questions",
  admin: "/admin/common_questions",
};

const CommonQuestionsService = {
  list(role = "student") {
    return http.get(ENDPOINTS[role] || ENDPOINTS.student);
  },
};

export default CommonQuestionsService;
