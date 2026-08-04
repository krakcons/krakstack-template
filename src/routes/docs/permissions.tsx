import { ProjectAccessMatrix } from "@krak-stack/auth/access/matrix";
import { ClientOnly, createFileRoute, notFound } from "@tanstack/react-router";

import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-switcher";
import { appDocs } from "@/lib/app-docs";
import {
  DocsContent,
  DocsFooter,
  DocsHeader,
  DocsLayout,
  DocsPage,
} from "@/lib/docs";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { Access, AccessLabels } from "@/services/auth/access";

export const Route = createFileRoute("/docs/permissions")({
  loader: () => {
    const resolution = appDocs.resolve("permissions", getLocale());
    if (!resolution) throw notFound();
    return resolution;
  },
  head: ({ loaderData }) =>
    appDocs.getHead({
      locale: loaderData?.page.locale ?? getLocale(),
      ...(loaderData?.page ? { page: loaderData.page } : {}),
    }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const resolution = Route.useLoaderData();

  return (
    <DocsLayout
      docs={appDocs}
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
      <DocsPage docs={appDocs} resolution={resolution}>
        <DocsHeader docs={appDocs} resolution={resolution} />
        <DocsContent docs={appDocs} resolution={resolution} />
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
        <DocsFooter docs={appDocs} resolution={resolution} />
      </DocsPage>
    </DocsLayout>
  );
}

const DocsThemeSwitcher = () => {
  const { setTheme, theme } = useTheme();
  return <ThemeSwitcher value={theme} onChange={setTheme} />;
};
