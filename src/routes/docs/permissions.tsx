import { createFileRoute } from "@tanstack/react-router";
import { ProjectAccessMatrix } from "@krak-stack/auth/access/matrix";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { AppBrand } from "@/components/ui/app-brand";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { Access, AccessLabels } from "@/services/auth/access";

const PermissionsPage = () => (
  <div className="min-h-screen">
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="/" className="rounded-sm focus-visible:outline-2">
          <AppBrand
            label={m.home_brand()}
            subtitle={m.docs_permissions_nav_label()}
            icon={LayoutDashboard}
          />
        </a>
        <LocaleSwitcher />
      </nav>
    </header>

    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16">
      <section className="flex max-w-3xl flex-col gap-5">
        <a
          href="/"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm underline-offset-4 transition-colors hover:underline"
        >
          <ArrowLeft className="size-4" />
          {m.docs_permissions_back_home()}
        </a>
        <div className="flex flex-col gap-3">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            {m.docs_permissions_eyebrow()}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {m.docs_permissions_title()}
          </h1>
          <p className="text-muted-foreground text-lg leading-8">
            {m.docs_permissions_description()}
          </p>
        </div>
      </section>

      <section aria-labelledby="permissions-matrix-title" className="space-y-4">
        <div className="space-y-2">
          <h2 id="permissions-matrix-title" className="text-2xl font-semibold">
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

      <section className="border-primary/30 bg-card grid gap-6 border-l-4 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            {m.docs_permissions_ceilings_title()}
          </h2>
          <p className="text-muted-foreground leading-7">
            {m.docs_permissions_ceilings_description()}
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            {m.docs_permissions_intersection_title()}
          </h2>
          <p className="text-muted-foreground leading-7">
            {m.docs_permissions_user_intersection()}
          </p>
          <p className="text-muted-foreground leading-7">
            {m.docs_permissions_other_intersection()}
          </p>
        </div>
      </section>
    </main>
  </div>
);

export const Route = createFileRoute("/docs/permissions")({
  head: () => ({
    meta: [{ title: `${m.docs_permissions_title()} | ${m.home_brand()}` }],
  }),
  component: PermissionsPage,
});
