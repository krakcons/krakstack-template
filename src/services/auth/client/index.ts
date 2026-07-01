import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authBaseUrl = import.meta.env.VITE_KRAKSTACK_AUTH_URL;

export const authUrl = (path: string) => new URL(path, authBaseUrl).toString();

export const authLoginUrl = (
  callbackURL: string,
  locale: "en" | "fr" = "en",
) => {
  const url = new URL(`/${locale}/sign-in`, authBaseUrl);
  url.searchParams.set("redirect", callbackURL);
  return url.toString();
};

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    twoFactorClient({
      twoFactorPage: `${authBaseUrl}/2fa`,
    }),
    organizationClient(),
    apiKeyClient(),
  ],
});
