import { authSessionAtom as makeAuthSessionAtom } from "@krak-stack/auth/components";
import { createIsomorphicFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { AtomRegistry } from "effect/unstable/reactivity";

const appBaseUrl = createIsomorphicFn()
  .server(() => import.meta.env.VITE_SITE_URL)
  .client(() => window.location.origin);

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

export const authCallbackUrl = createIsomorphicFn()
  .server((path: string) => path)
  .client((path: string) => {
    const url = new URL(path, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  });

export const authSessionAtom = makeAuthSessionAtom(appBaseUrl());

export const getAuthSession = async () => {
  const registry = AtomRegistry.make();

  try {
    return await Effect.runPromise(
      AtomRegistry.getResult(registry, authSessionAtom, {
        suspendOnWaiting: true,
      }),
    );
  } finally {
    registry.dispose();
  }
};
