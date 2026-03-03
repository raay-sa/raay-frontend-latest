// src/services/teacher/supportService.js
import http from "../http";

const SupportService = {
  create: (payload) => http.post("/teacher/support", payload), 
};

export default SupportService;
