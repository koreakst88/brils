import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("@amplitude/plugin-session-replay-browser") ||
            id.includes("rrweb")
          ) {
            return "amplitude-replay";
          }
        },
      },
    },
  },
  plugins: [react()],
  publicDir: "../../public",
});
