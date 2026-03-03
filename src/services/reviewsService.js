import http from "./http";

const ENDPOINT = "/admin/reviews";

export const ReviewsService = {
  list: (params = {}) => http.get(ENDPOINT, { params }),
  get: (id) => http.get(`${ENDPOINT}/${id}`),
  create: (data) => http.post(ENDPOINT, data),
  update: (id, data) =>
    http.post(`${ENDPOINT}/${id}`, {
      ...data,
      _method: "put",
    }),

      bulkDelete: (ids = []) =>
    http.post(`/admin/reviews/multi_delete`, { reviews_id: ids }),

  export: () =>
    http.get(`/admin/reviews/download`, { responseType: "blob" }),

    bulkHide: (ids = []) =>
    http.post(`/admin/reviews/multi_hide`, { reviews_id: ids }),
};
