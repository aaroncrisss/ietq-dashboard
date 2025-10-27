import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Escucha en 0.0.0.0 (accesible desde Coolify)
    port: parseInt(process.env.PORT || "8080"), // Usa el puerto definido por Coolify o 8080 por defecto
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || "4173"),
    allowedHosts: [/\.sslip\.io$/], // Permite todos los subdominios *.sslip.io (Coolify)
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
