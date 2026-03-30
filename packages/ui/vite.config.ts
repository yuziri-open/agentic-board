import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@agentic-board/shared": fileURLToPath(new URL("../shared/src/types.ts", import.meta.url))
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000"
    }
  }
});
