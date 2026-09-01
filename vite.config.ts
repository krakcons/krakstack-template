import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { fileURLToPath, URL } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["effect"],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["@krak-stack/auth"],
  },
  ssr: {
    noExternal: ["@krak-stack/auth"],
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  plugins: [
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
      cookieName: "locale",
      urlPatterns: [
        {
          pattern: "/:path(.*)?",
          localized: [
            ["en", "/en/:path(.*)?"],
            ["fr", "/fr/:path(.*)?"],
          ],
        },
      ],
      routeStrategies: [{ match: "/api/:path(.*)?", exclude: true }],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
