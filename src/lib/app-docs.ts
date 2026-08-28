import { LayoutDashboard } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";

import { createDocsSource, makeDocs } from "@krak-stack/registry/docs";
import { m } from "@/paraglide/messages";

const locales = ["en", "fr"] as const;

const docsOrigin = (): `http://${string}` | `https://${string}` => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  if (!siteUrl) throw new Error("VITE_SITE_URL is required");

  const origin = new URL(siteUrl).origin;

  if (origin.startsWith("http://")) return `http://${origin.slice(7)}`;
  if (origin.startsWith("https://")) return `https://${origin.slice(8)}`;

  throw new Error("VITE_SITE_URL must use HTTP or HTTPS");
};

export const makeAppDocs = (pages: ReadonlyArray<unknown>) =>
  makeDocs({
    source: createDocsSource({ pages, locales }),
    basePath: "/docs",
    defaultSlug: "overview",
    defaultLocale: "en",
    origin: docsOrigin(),
    siteName: "KrakStack",
    sectionOrder: ["start", "reference"],
    brand: {
      label: "KrakStack",
      subtitle: () => m.docs_permissions_nav_label(),
      icon: LayoutDashboard,
      href: "/",
    },
    github: {
      url: "https://github.com/krakcons/krakstack-template",
    },
    messages: () => ({
      title: m.docs_permissions_nav_label(),
      description: m.docs_description(),
      sectionLabel: (section) =>
        section === "start"
          ? m.docs_section_start()
          : section === "reference"
            ? m.docs_section_reference()
            : section,
    }),
  });

export const appDocsShell = makeAppDocs([]);

export const getAppDocsPages = createServerFn({ method: "GET" }).handler(
  async () => {
    const { loadAppDocsPages } = await import("./app-docs.server");
    return loadAppDocsPages();
  },
);
