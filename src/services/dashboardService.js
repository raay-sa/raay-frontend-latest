import http from "./http";

const BASE = "/admin/dashboard";
const STATS_BASE = "/admin/statistics";

// ---- Date helpers (same keys used everywhere) ----
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

export const DashboardService = {
  // Dashboard summary & charts — all accept a date range
  getSummary: (startDate, endDate) =>
    http.get(`${BASE}`, { params: withRange(startDate, endDate) }),

  getUserRegistrations: (startDate, endDate) =>
    http.get(`${BASE}/user_registration`, {
      params: withRange(startDate, endDate),
    }),

  getProfitStats: (startDate, endDate) =>
    http.get(`${BASE}/profit_stats`, { params: withRange(startDate, endDate) }),

  getContentStats: (startDate, endDate) =>
    http.get(`${BASE}/content_stats`, {
      params: withRange(startDate, endDate),
    }),

  getLastTransactions: (startDate, endDate) =>
    http.get(`${BASE}/last_transactions`, {
      params: withRange(startDate, endDate),
    }),

  // Excel exports (statistics endpoints), unified with same range keys
  exportUserRegistrationExcel: (startDate, endDate) =>
    http.get(`${STATS_BASE}/user_registration/excel`, {
      params: withRange(startDate, endDate),
      responseType: "blob",
    }),

  exportProfitStatsExcel: (startDate, endDate) =>
    http.get(`${STATS_BASE}/profit_stats/excel`, {
      params: withRange(startDate, endDate),
      responseType: "blob",
    }),

  exportProgramSubscriptionsExcel: (startDate, endDate) =>
    http.get(`${STATS_BASE}/program_subscriptions/excel`, {
      params: withRange(startDate, endDate),
      responseType: "blob",
    }),
};
