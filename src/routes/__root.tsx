import { KrakstackAuthProvider } from "@krak-stack/auth/components";
import { KrakstackProvider } from "@krak-stack/registry/krakstack-provider";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { useAtomSubscribe, useAtomValue } from "@effect/atom-react";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  stripSearchParams,
} from "@tanstack/react-router";
import { Effect } from "effect";
import { AsyncResult, type AtomRegistry } from "effect/reactivity";

import { ThemeProvider, useTheme } from "@/components/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiClient } from "@/lib/api-client";
import { authSessionAtom } from "@/services/auth/client";
import { m } from "../paraglide/messages.js";
import { getLocale, locales } from "../paraglide/runtime.js";
import { Access, AccessLabels } from "@/services/auth/access";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
  registry: AtomRegistry.AtomRegistry;
}>()({
  search: {
    middlewares: [
      stripSearchParams<{ page?: number; pageSize?: number }>({
        page: 0,
        pageSize: 20,
      }),
    ],
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: `${m.home_brand()} ${m.app_name()}`,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <KrakstackProvider locale={getLocale()} locales={locales}>
      <ThemeProvider>
        <RootDocument>{children}</RootDocument>
      </ThemeProvider>
    </KrakstackProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const runtime = useAtomValue(ApiClient.runtime);
  const { systemTheme, theme } = useTheme();

  useAtomSubscribe(
    authSessionAtom,
    (session) => {
      if (!AsyncResult.isSuccess(runtime)) return;
      Effect.runFork(
        BrowserOtlp.identify(
          AsyncResult.isSuccess(session) && !session.waiting && session.value
            ? {
                userId: session.value.user.id,
                organizationId:
                  session.value.session.activeOrganizationId ?? undefined,
              }
            : null,
        ),
      );
    },
    { immediate: true },
  );

  return (
    <html
      className={theme === "system" ? systemTheme : theme}
      lang={getLocale()}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <KrakstackAuthProvider
            access={Access}
            accessLabels={AccessLabels}
            projectId={import.meta.env.VITE_KRAKSTACK_AUTH_PROJECT_ID}
          >
            {children}
          </KrakstackAuthProvider>
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
