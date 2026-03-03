// src/services/teacher/statisticsService.js
import http from "../http";

const BASE = "/teacher/statistics";

export const statisticsService = {
  getUserRegistrations: (params) =>
    http.get(`${BASE}/user_registration`, { params }),

  getProfitStats: (params) => http.get(`${BASE}/profit_stats`, { params }),

  getContentStats: (params) => http.get(`${BASE}/content_stats`, { params }),

  getProgramInteractions: (params) =>
    http.get(`${BASE}/program_interactions`, { params }),

  getReviews: (params) => http.get(`${BASE}/reviews`, { params }),

  getAchievements: (params) => http.get(`${BASE}/achievements`, { params }),

  getBestTrainers: (params) => http.get(`${BASE}/best_trainers`, { params }),
};

export default statisticsService;
