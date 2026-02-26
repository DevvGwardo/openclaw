import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  base: "/",
  publicDir: path.resolve(here, "public"),
  optimizeDeps: {
    include: ["lit/directives/repeat.js"],
  },
  build: {
    outDir: path.resolve(here, "../apps/tauri/dist-ui"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(here, "tauri.html"),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
});
