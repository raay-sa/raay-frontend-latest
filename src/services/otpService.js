import http from "./http";

export default {
  sendOtp: (identifier, authMethod) => {
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const payload = isEmail 
      ? { email: identifier, auth_method: authMethod }
      : { phone: identifier, auth_method: authMethod };
    return http.post("/sendOtp", payload);
  },

  verifyOtp: (identifier, code, authMethod) => {
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const payload = isEmail
      ? { email: identifier, code, auth_method: authMethod }
      : { phone: identifier, code, auth_method: authMethod };
    return http.post("/verifyOtp", payload);
  },
};
