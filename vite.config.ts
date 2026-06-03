import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "force-full-reload-on-src-change",
      handleHotUpdate({ file, server }) {
        // Fallback for environments where module matching fails: force browser reload on src changes.
        if (file.includes("/src/") || file.includes("\\src\\")) {
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
    },
  ],
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});