import { createAuthUiClient } from "@krak-stack/auth";

const appBaseUrl = () =>
  typeof window === "undefined"
    ? import.meta.env.VITE_SITE_URL
    : window.location.origin;

export const krakstackAuthUrl = import.meta.env.VITE_KRAKSTACK_AUTH_URL;

export const authUrl = (path: string) =>
  new URL(path, krakstackAuthUrl).toString();

export const authLoginUrl = (
  callbackURL: string,
  locale: "en" | "fr" = "en",
) => {
  const url = new URL("/sign-in", appBaseUrl());
  url.searchParams.set("redirect", callbackURL);
  url.searchParams.set("locale", locale);
  return url.toString();
};

export const authCallbackUrl = (path: string) => {
  if (typeof window === "undefined") return path;

  const url = new URL(path, window.location.origin);
  return `${url.pathname}${url.search}${url.hash}`;
};

export const authClient = createAuthUiClient(appBaseUrl());
