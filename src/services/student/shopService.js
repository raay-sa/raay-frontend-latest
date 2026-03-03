// src/services/student/shopService.js
import http from "../http";

const StudentShopService = {
  list: (params = {}) => http.get("/student/cart", { params }),
  remove: (rowId) => http.delete(`/student/cart/${rowId}`),
  addToCart: (program_id) => http.post("/student/cart", { program_id }),
  canPurchase: (program_id) => http.get(`/student/cart/can-purchase/${program_id}`),
  purchaseCourse: (cartId) => http.post(`/student/cart/${cartId}/purchase`),

  toggleFavorite: (program_id) =>
    http.post("/student/favorites", { program_id }),
  listFavorites: (params = {}) => http.get("/student/favorites", { params }),

  createTapPayment: ({ amount }) =>
    http.post("/student/transactions/checkout", {
      amount,
    }),
};

export default StudentShopService;
