import { KrakstackAuthProvider } from "@krak-stack/auth";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { ThemeProvider, useTheme } from "@/components/ui/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";
import { Access, AccessLabels } from "@/services/auth/access";
import appCss from "../styles.css?url";

const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

export const Route = createRootRoute({
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
    scripts: analyticsWebsiteId
      ? [
          {
            defer: true,
            src: "https://analytics.krakconsultants.net/script.js",
            "data-website-id": analyticsWebsiteId,
          },
        ]
      : [],
  }),
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RootDocument>{children}</RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { systemTheme, theme } = useTheme();
  const locale = getLocale().startsWith("fr") ? "fr" : "en";

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
            locale={locale}
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
