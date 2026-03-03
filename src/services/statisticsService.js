// src/services/statisticsService.js
import http from "./http";

const safeDate = (d) => {
  if (!d) return new Date();
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return new Date();
  return x;
};

// Format: d-m-Y (e.g., 05-08-2025)
const fmt = (d) => {
  const x = safeDate(d);
  const day = String(x.getDate()).padStart(2, "0");
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const y = x.getFullYear();
  return `${day}-${m}-${y}`;
};

const withRange = (startDate, endDate) => ({
  from_date: fmt(startDate),
  to_date: fmt(endDate),
});

export const StatisticsService = {
  getUserRegistration: (startDate, endDate) =>
    http.get("/admin/statistics/user_registration", {
      params: withRange(startDate, endDate),
    }),

  getProfitStats: (startDate, endDate) =>
    http.get("/admin/statistics/profit_stats", {
      params: withRange(startDate, endDate),
    }),

  getReviewsStats: (startDate, endDate) =>
    http.get("/admin/statistics/reviews", {
      params: withRange(startDate, endDate),
    }),

  getProgramSubscriptions: (startDate, endDate) =>
    http.get("/admin/statistics/program_subscriptions", {
      params: withRange(startDate, endDate),
    }),

  getContentStats: (startDate, endDate) =>
    http.get("/admin/statistics/content_stats", {
      params: withRange(startDate, endDate),
    }),

      getTeachersActivity: (startDate, endDate) =>
    http.get("/admin/statistics/teachers_activity", {
      params: withRange(startDate, endDate),
    }),
};
