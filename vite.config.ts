import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: parseInt(process.env.PORT || "8080"),
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || "4173"),
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      // Dominio de Coolify (ajústalo si cambia)
      "y8s8wcg4kock8woso8okw48c.31.97.163.113.sslip.io",
      "https://dashboardietq.proyectosbeta.site"
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
