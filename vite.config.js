import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // e.g. VITE_BASE_URL=https://backend.raay.sa
  const backend = (env.VITE_BASE_URL || "").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: backend
        ? {
            // Proxy ALL API calls in dev to the backend so they are same-origin
            "/api": {
              target: backend, // -> https://backend.raay.sa
              changeOrigin: true,
              secure: false,
            },
            // You already had this:
            "/uploads": {
              target: backend,
              changeOrigin: true,
              secure: false,
            },
            // IMPORTANT: Proxy storage so PDFs are same-origin in dev
            "/storage": {
              target: backend,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
