import { ProjectAccessMatrix } from "@krak-stack/auth/access/matrix";
import { ClientOnly, createFileRoute, notFound } from "@tanstack/react-router";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
import {
  DocsContent,
  DocsFooter,
  DocsHeader,
  DocsLayout,
  DocsPage,
} from "@krak-stack/registry/docs";
import { getAppDocsPages, makeAppDocs } from "@/lib/app-docs";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { Access, AccessLabels } from "@/services/auth/access";

export const Route = createFileRoute("/docs/permissions")({
  loader: async () => {
    const pages = await getAppDocsPages();
    const docs = makeAppDocs(pages);
    const resolution = docs.resolve("permissions", getLocale());
    if (!resolution) throw notFound();
    return { pages, resolution };
  },
  head: ({ loaderData }) => {
    const docs = makeAppDocs(loaderData?.pages ?? []);
    const locale = loaderData?.resolution.page.locale ?? getLocale();
    return loaderData?.resolution.page
      ? docs.getHead({ locale, page: loaderData.resolution.page })
      : docs.getHead({ locale });
  },
  component: PermissionsPage,
});

function PermissionsPage() {
  const { pages, resolution } = Route.useLoaderData();
  const docs = makeAppDocs(pages);

  return (
    <DocsLayout
      docs={docs}
      locale={resolution.page.locale}
      headerActions={
        <>
          <ClientOnly fallback={null}>
            <DocsThemeSwitcher />
          </ClientOnly>
          <LocaleSwitcher />
        </>
      }
    >
      <DocsPage docs={docs} resolution={resolution}>
        <DocsHeader docs={docs} resolution={resolution} />
        <DocsContent docs={docs} resolution={resolution} />
        <section
          aria-labelledby="permissions-matrix-title"
          className="mt-12 space-y-4 border-t pt-8"
        >
          <div className="space-y-2">
            <h2
              id="permissions-matrix-title"
              className="text-2xl font-semibold"
            >
              {m.docs_permissions_matrix_title()}
            </h2>
            <p className="text-muted-foreground max-w-3xl leading-7">
              {m.docs_permissions_matrix_description()}
            </p>
          </div>
          <ProjectAccessMatrix
            access={Access}
            labels={AccessLabels}
            locale={getLocale()}
          />
        </section>
        <DocsFooter docs={docs} resolution={resolution} />
      </DocsPage>
    </DocsLayout>
  );
}

const DocsThemeSwitcher = () => {
  const { setTheme, theme } = useTheme();
  return <ThemeSwitcher value={theme} onChange={setTheme} />;
};
