// src/services/categoriesService.js
import http from "./http";

const ENDPOINT = "/admin/categories";

export const CategoriesService = {
  // Support both paginated and legacy responses on the consumer side.
  list: (params) => http.get('/admin/paginated_categories', { params }),

  get: (id) => http.get(`${ENDPOINT}/${id}`),

  create: (data) => {
    // data: { title: { ar: string, en: string }, image_ar?: File, image_en?: File }
    const form = new FormData();
    form.append("title[ar]", data.title.ar);
    form.append("title[en]", data.title.en);
    if (data.image_ar instanceof File) {
      form.append("image_ar", data.image_ar);
    }
    if (data.image_en instanceof File) {
      form.append("image_en", data.image_en);
    }
    return http.post(ENDPOINT, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id, data) => {
    // data: { title: { ar: string, en: string }, image_ar?: File, image_en?: File }
    const form = new FormData();
    form.append("_method", "PUT");
    if (data.title !== undefined) {
      form.append("title[ar]", data.title.ar);
      form.append("title[en]", data.title.en);
    }
    if (data.image_ar instanceof File) {
      form.append("image_ar", data.image_ar);
    }
    if (data.image_en instanceof File) {
      form.append("image_en", data.image_en);
    }
    return http.post(`${ENDPOINT}/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (id) => http.delete(`${ENDPOINT}/${id}`),

  bulkDelete: (ids) =>
    http.post(`${ENDPOINT}/multi_delete`, { categories_id: ids }),
};
