import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6102,
    strictPort: true
  },
  preview: {
    port: 6102,
    strictPort: true
  },
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist"],
    reporters: ["default"]
  }
});
