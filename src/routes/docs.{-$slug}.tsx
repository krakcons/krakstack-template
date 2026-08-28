import {
  ClientOnly,
  createFileRoute,
  notFound,
  redirect,
} from "@tanstack/react-router";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
import { DocsLayout, DocsNotFound, DocsPage } from "@krak-stack/registry/docs";
import { appDocsShell, getAppDocsPages, makeAppDocs } from "@/lib/app-docs";
import { getLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/docs/{-$slug}")({
  loader: async ({ params }) => {
    const pages = await getAppDocsPages();
    const docs = makeAppDocs(pages);
    const resolution = docs.resolve(params.slug, getLocale());
    if (!resolution) throw notFound();

    if (!resolution.canonical) {
      throw redirect({ to: resolution.page.path, statusCode: 301 });
    }

    return { pages, resolution };
  },
  head: ({ loaderData }) => {
    const docs = makeAppDocs(loaderData?.pages ?? []);
    const locale = loaderData?.resolution.page.locale ?? getLocale();
    return loaderData?.resolution.page
      ? docs.getHead({ locale, page: loaderData.resolution.page })
      : docs.getHead({ locale });
  },
  component: DocsRoutePage,
  notFoundComponent: () => (
    <DocsNotFound docs={appDocsShell} locale={getLocale()} />
  ),
});

function DocsRoutePage() {
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
      <DocsPage docs={docs} resolution={resolution} />
    </DocsLayout>
  );
}

const DocsThemeSwitcher = () => {
  const { setTheme, theme } = useTheme();
  return <ThemeSwitcher value={theme} onChange={setTheme} />;
};
