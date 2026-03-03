// src/services/publicService.js
import http from "./http";

export const PublicService = {
  getCategories: () => http.get("/public/categories"),
};

export default PublicService;
