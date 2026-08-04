import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { Schema } from "effect";

import { AppBrand } from "@/components/ui/app-brand";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

const RedirectPath = Schema.String.pipe(
  Schema.refine(
    (value): value is string =>
      value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"),
    { message: "Redirect must be a same-origin path" },
  ),
).annotate({ identifier: "AuthRedirectPath" });

const AuthSearchSchema = Schema.toStandardSchemaV1(
  Schema.Struct({
    callbackURL: Schema.optional(RedirectPath),
    redirect: Schema.optional(RedirectPath),
    redirectTo: Schema.optional(RedirectPath),
    returnTo: Schema.optional(RedirectPath),
  }).annotate({ identifier: "AuthSearch" }),
);

const safeRedirect = (value: string | undefined) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/admin";

export const Route = createFileRoute("/_auth")({
  validateSearch: AuthSearchSchema,
  ssr: false,
  beforeLoad: async ({ search }) => {
    const session = await authClient.getSession();

    if (session.data) {
      throw redirect({
        href: safeRedirect(search.redirect),
        reloadDocument: true,
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="bg-muted/30 relative flex min-h-svh items-center justify-center px-4 py-24">
      <AppBrand
        className="absolute top-5 left-5 sm:top-7 sm:left-7"
        label={m.home_brand()}
        subtitle={m.app_name()}
        icon={LayoutDashboard}
        to="/"
      />
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  );
}
