import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This allows access from any IP on your network
    port: 5173,
  },
  define: {
    // Define environment variables that will be available at build time
    IS_LOCAL: JSON.stringify(process.env.IS_LOCAL === "true"),
  },
});
