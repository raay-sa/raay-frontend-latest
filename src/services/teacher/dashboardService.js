// src/services/teacher/dashboardService.js
import http from "../http";

const BASE = "/teacher/dashboard";

export const dashboardService = {
  getSummary: () => http.get(`${BASE}`),

  // returns { current_month: [{label, count_students}], last_month: [...] }
  getUserRegistrations: () => http.get(`${BASE}/user_registration`),

  // filter: monthly | weekly | yearly
  getProfitStats: (filter = "monthly") =>
    http.get(`${BASE}/profit_stats`, { params: { filter } }),

  getContentStats: () => http.get(`${BASE}/content_stats`),

  // returns [{ program, reviews, assignments }]
  getProgramInteractions: () => http.get(`${BASE}/program_interactions`),

  // filter: monthly | weekly | yearly
  getReviews: (filter = "monthly") =>
    http.get(`${BASE}/reviews`, { params: { filter } }),

  getLastTransactions: () => http.get(`${BASE}/last_transactions`),
};

export default dashboardService;
