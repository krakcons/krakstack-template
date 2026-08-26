import { AuthService } from "@krak-stack/auth/server";
import { Effect } from "effect";
import {
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { ApplicationApi } from "@/api";
import {
  absoluteUrl,
} from "@/auth";
import { getMessages, type Locale } from "@/messages";
import type { OrganizationSummary, UserSession } from "@/auth";
import { Tasks } from "@/services/task";
import {
  renderAdminPage,
  renderForgotPasswordPage,
  renderHomePage,
  renderResetPasswordPage,
  renderSignInPage,
  renderVerifyEmailPage,
  type AdminSection,
  type Theme,
} from "@/view";

const fromWeb = (response: Response) => HttpServerResponse.fromWeb(response);
const htmlResponse = (body: string, init?: ResponseInit) =>
  fromWeb(
    new Response(body, {
      ...init,
      headers: { "Content-Type": "text/html; charset=utf-8", ...init?.headers },
    }),
  );
const redirectTo = (path: string, headers?: Headers) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Location", path);
  responseHeaders.delete("Content-Length");
  responseHeaders.delete("Content-Type");
  return fromWeb(new Response(null, { status: 303, headers: responseHeaders }));
};
const cookieValue = (
  request: HttpServerRequest.HttpServerRequest,
  name: string,
) =>
  request.headers.cookie
    ?.split(";")
    .map((part) => part.trim().split("=", 2))
    .find(([key]) => key === name)?.[1];
const themeFromRequest = (
  request: HttpServerRequest.HttpServerRequest,
): Theme => {
  const theme = cookieValue(request, "theme");
  return theme === "light" || theme === "dark" ? theme : "system";
};
const currentSession = Effect.gen(function* () {
  const auth = yield* AuthService;
  return yield* auth.getSession().pipe(Effect.catch(() => Effect.succeed(null)));
});

const renderAdmin = (
  locale: Locale,
  section: AdminSection,
  extras?: {
    readonly createdKey?: string;
    readonly twoFactorSetup?: {
      readonly totpURI: string;
      readonly backupCodes: ReadonlyArray<string>;
    };
  },
) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const auth = yield* AuthService;
    const session = yield* currentSession;
    if (!session?.user) return redirectTo(`/${locale}/sign-in`);

    const tasksService = yield* Tasks;
    const tasks =
      section === "tasks"
        ? yield* tasksService.list({ userId: session.user.id }).pipe(Effect.orDie)
        : [];
    const organizations: ReadonlyArray<OrganizationSummary> = yield* auth.organizations
      .listOrganizations({ query: { userId: session.user.id } })
      .pipe(
        Effect.map((response) =>
          response.data.map((organization: OrganizationSummary) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          })),
        ),
        Effect.catch(() => Effect.succeed([])),
      );
    const apiKeys = section === "api-keys"
      ? yield* auth.auth
          .apiKeyList({
            query: { configId: "user" },
          })
          .pipe(
            Effect.map((response) =>
              response.apiKeys.map((key) => ({
                id: key.id,
                name: key.name,
                enabled: key.enabled !== false,
                start: key.start,
              })),
            ),
            Effect.catch(() => Effect.succeed([])),
          )
      : [];

    const userSession: UserSession = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
      },
      ...(session.session.activeOrganizationId
        ? { activeOrganizationId: session.session.activeOrganizationId }
        : {}),
    };
    return htmlResponse(
      renderAdminPage({ locale }, {
        session: userSession,
        section,
        tasks,
        organizations,
        apiKeys,
        theme: themeFromRequest(request),
        ...(extras?.createdKey ? { createdKey: extras.createdKey } : {}),
        ...(extras?.twoFactorSetup
          ? { twoFactorSetup: extras.twoFactorSetup }
          : {}),
      }).value,
    );
  });

export const publicPagesHandler = HttpApiBuilder.group(
  ApplicationApi,
  "publicPages",
  (handlers) =>
    handlers
      .handle("root", () =>
        Effect.succeed(HttpServerResponse.redirect("/en", { status: 303 })),
      )
      .handle("home", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          return htmlResponse(
            renderHomePage(
              { locale: params.locale },
              themeFromRequest(request),
            ).value,
          );
        }),
      ),
);

export const authenticationPagesHandler = HttpApiBuilder.group(
  ApplicationApi,
  "authenticationPages",
  (handlers) =>
    handlers
      .handle("signInPage", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const session = yield* currentSession;
          return session
            ? redirectTo(`/${params.locale}/admin`)
            : htmlResponse(
                renderSignInPage(
                  { locale: params.locale },
                  themeFromRequest(request),
                ).value,
              );
        }),
      )
      .handle("signIn", ({ params, payload }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const auth = yield* AuthService;
          return yield* auth.auth
            .signInEmail({
              responseMode: "decoded-and-response",
              payload: {
                email: payload.email.trim(),
                password: payload.password,
                callbackURL: absoluteUrl(
                  request,
                  `/${params.locale}/admin`,
                ),
              },
            })
            .pipe(
              Effect.map(([body, response]) =>
                redirectTo(
                  typeof body.url === "string"
                    ? body.url
                    : `/${params.locale}/admin`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(
                    renderSignInPage(
                      { locale: params.locale },
                      themeFromRequest(request),
                      getMessages(params.locale).serverError,
                    ).value,
                    { status: 401 },
                  ),
                ),
              ),
            );
        }),
      )
      .handle("forgotPasswordPage", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          return htmlResponse(
            renderForgotPasswordPage(
              { locale: params.locale },
              themeFromRequest(request),
            ).value,
          );
        }),
      )
      .handle("forgotPassword", ({ params, payload }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const auth = yield* AuthService;
          return yield* auth.auth
            .requestPasswordReset({
              responseMode: "decoded-and-response",
              payload: {
                email: payload.email.trim(),
                redirectTo: absoluteUrl(
                  request,
                  `/${params.locale}/reset-password`,
                ),
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/sign-in`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("resetPasswordPage", ({ params, query }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          return htmlResponse(
            renderResetPasswordPage(
              { locale: params.locale },
              themeFromRequest(request),
              query.token ?? "",
            ).value,
          );
        }),
      )
      .handle("resetPassword", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .resetPassword({
              responseMode: "decoded-and-response",
              payload,
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/sign-in`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("verifyEmailPage", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          return htmlResponse(
            renderVerifyEmailPage(
              { locale: params.locale },
              themeFromRequest(request),
            ).value,
          );
        }),
      )
      .handle("sendVerification", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .sendVerificationOtp({
              responseMode: "decoded-and-response",
              payload: {
                email: payload.email.trim(),
                type: "email-verification",
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/verify-email`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("verifyEmail", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .verifyEmailOtp({
              responseMode: "decoded-and-response",
              payload: {
                email: payload.email.trim(),
                otp: payload.otp.trim(),
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("logout", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .signOut({ responseMode: "decoded-and-response" })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      ),
);

export const themeHandler = HttpApiBuilder.group(
  ApplicationApi,
  "theme",
  (handlers) =>
    handlers.handle("setTheme", ({ payload }) => {
      const theme =
        payload.theme === "light" || payload.theme === "dark"
          ? payload.theme
          : "system";
      return Effect.succeed(
        fromWeb(
          Response.json(
            { theme },
            {
              headers: {
                "Set-Cookie": `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`,
              },
            },
          ),
        ),
      );
    }),
);

export const adminPagesHandler = HttpApiBuilder.group(
  ApplicationApi,
  "adminPages",
  (handlers) =>
    handlers
      .handle("tasks", ({ params }) => renderAdmin(params.locale, "tasks"))
      .handle("tasksSection", ({ params }) =>
        renderAdmin(params.locale, "tasks"),
      )
      .handle("section", ({ params }) =>
        renderAdmin(params.locale, params.section),
      ),
);

export const accountActionsHandler = HttpApiBuilder.group(
  ApplicationApi,
  "accountActions",
  (handlers) =>
    handlers
      .handle("profile", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .updateUser({
              responseMode: "decoded-and-response",
              payload: {
                name: payload.name.trim(),
                image: payload.image?.trim() ?? "",
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/account`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("password", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .changePassword({
              responseMode: "decoded-and-response",
              payload: {
                currentPassword: payload.currentPassword,
                newPassword: payload.newPassword,
                revokeOtherSessions: true,
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/security`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("enableTwoFactor", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .twoFactorEnable({
              responseMode: "decoded-and-response",
              payload,
            })
            .pipe(
              Effect.flatMap(([twoFactorSetup]) =>
                renderAdmin(params.locale, "security", { twoFactorSetup }),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("verifyTwoFactor", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .twoFactorVerifyTotp({
              responseMode: "decoded-and-response",
              payload,
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/security`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("disableTwoFactor", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .twoFactorDisable({
              responseMode: "decoded-and-response",
              payload,
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/security`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("createApiKey", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          yield* auth.requireUser();
          const name = payload.name.trim();
          const createdKey = name
            ? (yield* auth.authExtra
                .createApiKey({ payload: { configId: "user", name } })
                .pipe(Effect.orDie)).key
            : undefined;
          return yield* renderAdmin(params.locale, "api-keys", { createdKey });
        }),
      )
      .handle("deleteApiKey", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .apiKeyDelete({
              responseMode: "decoded-and-response",
              payload: { configId: "user", keyId: params.id },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/api-keys`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("createOrganization", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .organizationCreate({
              responseMode: "decoded-and-response",
              payload: {
                name: payload.name.trim(),
                slug: payload.slug.trim(),
                metadata: {},
              },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/organizations`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      )
      .handle("activateOrganization", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* AuthService;
          return yield* auth.auth
            .organizationSetActive({
              responseMode: "decoded-and-response",
              payload: { organizationId: params.id },
            })
            .pipe(
              Effect.map(([, response]) =>
                redirectTo(
                  `/${params.locale}/admin/organizations`,
                  new Headers(response.headers),
                ),
              ),
              Effect.catch(() =>
                Effect.succeed(
                  htmlResponse(getMessages(params.locale).serverError, {
                    status: 400,
                  }),
                ),
              ),
            );
        }),
      ),
);
