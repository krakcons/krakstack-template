import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3106";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "bun --bun vite dev --config e2e/vite.config.ts --host 127.0.0.1 --port 3106 --strictPort",
    url: baseURL,
    reuseExistingServer: false,
    env: {
      VITE_SITE_URL: baseURL,
      VITE_KRAKSTACK_AUTH_URL: baseURL,
      VITE_KRAKSTACK_AUTH_PROJECT_ID: "",
      KRAKSTACK_AUTH_URL: baseURL,
      KRAKSTACK_AUTH_SERVICE_API_KEY: "e2e-unused",
      // Browser tests intercept API traffic; never connect to an application database.
      DATABASE_URL: "postgresql://unused:unused@127.0.0.1:1/unused",
      OTEL_SDK_DISABLED: "true",
    },
  },
});
