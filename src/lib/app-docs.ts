import { docsSource, makeDocs } from "@/lib/docs";
import { m } from "@/paraglide/messages";

const docsOrigin = (): `http://${string}` | `https://${string}` => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  if (!siteUrl) throw new Error("VITE_SITE_URL is required");

  const origin = new URL(siteUrl).origin;

  if (origin.startsWith("http://")) return `http://${origin.slice(7)}`;
  if (origin.startsWith("https://")) return `https://${origin.slice(8)}`;

  throw new Error("VITE_SITE_URL must use HTTP or HTTPS");
};

export const appDocs = makeDocs({
  source: docsSource,
  basePath: "/docs",
  defaultSlug: "overview",
  defaultLocale: "en",
  origin: docsOrigin(),
  siteName: "KrakStack",
  sectionOrder: ["start", "reference"],
  brand: {
    label: "KrakStack",
    subtitle: () => m.docs_permissions_nav_label(),
    icon: "lucide:layout-dashboard",
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
