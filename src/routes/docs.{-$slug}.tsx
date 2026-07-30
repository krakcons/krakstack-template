import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { appDocs } from "@/lib/app-docs";
import { DocsLayout, DocsNotFound, DocsPage } from "@/lib/docs";
import { getLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/docs/{-$slug}")({
  loader: ({ params }) => {
    const resolution = appDocs.resolve(params.slug, getLocale());
    if (!resolution) throw notFound();

    if (!resolution.canonical) {
      throw redirect({ to: resolution.page.path, statusCode: 301 });
    }

    return resolution;
  },
  head: ({ loaderData }) =>
    appDocs.getHead({
      locale: loaderData?.page.locale ?? getLocale(),
      ...(loaderData?.page ? { page: loaderData.page } : {}),
    }),
  component: DocsRoutePage,
  notFoundComponent: () => <DocsNotFound docs={appDocs} locale={getLocale()} />,
});

function DocsRoutePage() {
  const resolution = Route.useLoaderData();

  return (
    <DocsLayout
      docs={appDocs}
      locale={resolution.page.locale}
      headerActions={
        <>
          <ThemeSwitcher />
          <LocaleSwitcher />
        </>
      }
    >
      <DocsPage docs={appDocs} resolution={resolution} />
    </DocsLayout>
  );
}
