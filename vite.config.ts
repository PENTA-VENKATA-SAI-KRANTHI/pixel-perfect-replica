import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/pixel-perfect-replica/",
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      crawlLinks: true,
      failOnError: true,
    },
  },
});
