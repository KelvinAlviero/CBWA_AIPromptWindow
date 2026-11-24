import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the browser talks only to Vite (port 5173). Vite forwards
// /api and /auth to Express (port 3000), so cookies behave exactly like they
// do in production, where one server serves everything.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/auth": "http://localhost:3000",
    },
  },
});
