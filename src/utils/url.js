// src/utils/url.js
export const withBaseUrl = (path) => {
  if (!path) return "";
  // absolute URL? leave it
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_BASE_URL?.replace(/\/+$/, "") || "";
  const clean = String(path).replace(/^\/+/, "");
  return `${base}/${clean}`;
};
