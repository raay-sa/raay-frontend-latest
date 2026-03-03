import http from "./http";
import ENDPOINTS from "./endpoints";

export default {
  // login: (phone, password) => http.post(ENDPOINTS.LOGIN, { phone, password }),
  login: (data) => http.post(ENDPOINTS.LOGIN, data),

  register: (formData) =>
    http.post(ENDPOINTS.REGISTER, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  logout: (userId, userType) =>
    http.post(ENDPOINTS.LOGOUT, {
      user_id: userId,
      user_type: userType,
    }),
  me: (type) => {
    if (!type) throw new Error("Missing type for profile fetch");
    const endpoint = {
      admin: "/admin/profile",
      student: "/student/profile",
      teacher: "/teacher/profile",
    }[type];

    return http.get(endpoint);
  },
  refreshToken: (refreshToken) => 
    http.post("/auth/refresh-token", { refresh_token: refreshToken }),
  resetPassword: (phone, password, passwordConfirmation) =>
    http.post("/reset-password", { phone, password, password_confirmation: passwordConfirmation }),
};
