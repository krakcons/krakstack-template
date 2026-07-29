import { createAuthUiClient } from "@krak-stack/auth";

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

export const authClient = createAuthUiClient(authBaseUrl);
