import { AuthMiddleware } from "@krak-stack/auth/server";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";

import {
  TaskHtmlApiGroup,
  TasksApiGroup,
} from "@/services/task/api.group";

export const LocaleParams = Schema.Struct({
  locale: Schema.Literals(["en", "fr"]),
});

const IdParams = Schema.Struct({
  locale: Schema.Literals(["en", "fr"]),
  id: Schema.String,
});

const Html = Schema.String.pipe(
  HttpApiSchema.asText({ contentType: "text/html; charset=utf-8" }),
);
const RawResponse = Schema.Unknown;

const encodedForm = <S extends Schema.Top>(schema: S) =>
  [
    schema.pipe(HttpApiSchema.asFormUrlEncoded()),
    schema.pipe(HttpApiSchema.asMultipart()),
  ] as const;

const EmailForm = Schema.Struct({ email: Schema.String });
const SignInForm = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});
const ResetPasswordForm = Schema.Struct({
  token: Schema.String,
  newPassword: Schema.String,
});
const VerifyEmailForm = Schema.Struct({
  email: Schema.String,
  otp: Schema.String,
});
const ProfileForm = Schema.Struct({
  name: Schema.String,
  image: Schema.optional(Schema.String),
});
const PasswordForm = Schema.Struct({
  currentPassword: Schema.String,
  newPassword: Schema.String,
});
const PasswordOnlyForm = Schema.Struct({ password: Schema.String });
const TotpForm = Schema.Struct({ code: Schema.String });
const ApiKeyForm = Schema.Struct({ name: Schema.String });
const OrganizationForm = Schema.Struct({
  name: Schema.String,
  slug: Schema.String,
});

export class PublicPages extends HttpApiGroup.make("publicPages").add(
  HttpApiEndpoint.get("root", "/", { success: RawResponse }),
  HttpApiEndpoint.get("home", "/:locale", {
    params: LocaleParams,
    success: Html,
  }),
) {}

export class AuthenticationPages extends HttpApiGroup.make(
  "authenticationPages",
).add(
  HttpApiEndpoint.get("signInPage", "/:locale/sign-in", {
    params: LocaleParams,
    success: RawResponse,
  }),
  HttpApiEndpoint.post("signIn", "/:locale/sign-in", {
    params: LocaleParams,
    payload: encodedForm(SignInForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.get("forgotPasswordPage", "/:locale/forgot-password", {
    params: LocaleParams,
    success: Html,
  }),
  HttpApiEndpoint.post("forgotPassword", "/:locale/forgot-password", {
    params: LocaleParams,
    payload: encodedForm(EmailForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.get("resetPasswordPage", "/:locale/reset-password", {
    params: LocaleParams,
    query: { token: Schema.optional(Schema.String) },
    success: Html,
  }),
  HttpApiEndpoint.post("resetPassword", "/:locale/reset-password", {
    params: LocaleParams,
    payload: encodedForm(ResetPasswordForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.get("verifyEmailPage", "/:locale/verify-email", {
    params: LocaleParams,
    success: Html,
  }),
  HttpApiEndpoint.post("sendVerification", "/:locale/verify-email/send", {
    params: LocaleParams,
    payload: encodedForm(EmailForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post("verifyEmail", "/:locale/verify-email", {
    params: LocaleParams,
    payload: encodedForm(VerifyEmailForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post("logout", "/:locale/logout", {
    params: LocaleParams,
    success: RawResponse,
  }),
).middleware(AuthMiddleware) {}

export class ThemeRoutes extends HttpApiGroup.make("theme").add(
  HttpApiEndpoint.post("setTheme", "/:locale/theme", {
    params: LocaleParams,
    payload: Schema.Struct({
      theme: Schema.String,
    }),
    success: Schema.Struct({
      theme: Schema.Literals(["light", "dark", "system"]),
    }),
  }),
) {}

export class AdminPages extends HttpApiGroup.make("adminPages").add(
  HttpApiEndpoint.get("tasks", "/:locale/admin", {
    params: LocaleParams,
    success: RawResponse,
  }),
  HttpApiEndpoint.get("tasksSection", "/:locale/admin/tasks", {
    params: LocaleParams,
    success: RawResponse,
  }),
  HttpApiEndpoint.get("section", "/:locale/admin/:section", {
    params: Schema.Struct({
      locale: Schema.Literals(["en", "fr"]),
      section: Schema.Literals([
        "account",
        "security",
        "api-keys",
        "organizations",
        "permissions",
      ]),
    }),
    success: RawResponse,
  }),
).middleware(AuthMiddleware) {}

export class AccountActions extends HttpApiGroup.make("accountActions").add(
  HttpApiEndpoint.post("profile", "/:locale/admin/account", {
    params: LocaleParams,
    payload: encodedForm(ProfileForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post("password", "/:locale/admin/security/password", {
    params: LocaleParams,
    payload: encodedForm(PasswordForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post(
    "enableTwoFactor",
    "/:locale/admin/security/two-factor/enable",
    {
      params: LocaleParams,
      payload: encodedForm(PasswordOnlyForm),
      success: RawResponse,
    },
  ),
  HttpApiEndpoint.post(
    "verifyTwoFactor",
    "/:locale/admin/security/two-factor/verify",
    {
      params: LocaleParams,
      payload: encodedForm(TotpForm),
      success: RawResponse,
    },
  ),
  HttpApiEndpoint.post(
    "disableTwoFactor",
    "/:locale/admin/security/two-factor/disable",
    {
      params: LocaleParams,
      payload: encodedForm(PasswordOnlyForm),
      success: RawResponse,
    },
  ),
  HttpApiEndpoint.post("createApiKey", "/:locale/admin/api-keys", {
    params: LocaleParams,
    payload: encodedForm(ApiKeyForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post(
    "deleteApiKey",
    "/:locale/admin/api-keys/:id/delete",
    {
      params: IdParams,
      success: RawResponse,
    },
  ),
  HttpApiEndpoint.post("createOrganization", "/:locale/admin/organizations", {
    params: LocaleParams,
    payload: encodedForm(OrganizationForm),
    success: RawResponse,
  }),
  HttpApiEndpoint.post(
    "activateOrganization",
    "/:locale/admin/organizations/:id/activate",
    {
      params: IdParams,
      success: RawResponse,
    },
  ),
).middleware(AuthMiddleware) {}

export class ApplicationApi extends HttpApi.make("application")
  .add(
    PublicPages,
    AuthenticationPages,
    ThemeRoutes,
    AdminPages,
    TaskHtmlApiGroup,
    AccountActions,
    TasksApiGroup,
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack Datastar API",
      version: "1.0.0",
    }),
  ) {}
