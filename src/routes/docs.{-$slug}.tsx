import {
  ClientOnly,
  createFileRoute,
  notFound,
  redirect,
} from "@tanstack/react-router";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
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
          <ClientOnly fallback={null}>
            <DocsThemeSwitcher />
          </ClientOnly>
          <LocaleSwitcher />
        </>
      }
    >
      <DocsPage docs={appDocs} resolution={resolution} />
    </DocsLayout>
  );
}

const DocsThemeSwitcher = () => {
  const { setTheme, theme } = useTheme();
  return <ThemeSwitcher value={theme} onChange={setTheme} />;
};
