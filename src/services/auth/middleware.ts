import {
  ApiKeyPermissionGrant,
  AuthService,
  CurrentActor,
} from "@krak-stack/auth/server";
import { parseRoleList } from "@krak-stack/auth/roles";
import { Effect, Layer, Schema } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiError, HttpApiMiddleware } from "effect/unstable/httpapi";

import { Access } from "@/services/auth/access";

export class AuthMiddleware extends HttpApiMiddleware.Service<
  AuthMiddleware,
  {
    provides: CurrentActor | AuthService;
  }
>()("site/AuthMiddleware", {
  error: HttpApiError.Unauthorized,
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const auth = yield* AuthService.pipe(
          Effect.provide(AuthService.layer({ headers: request.headers })),
          Effect.mapError(() => new HttpApiError.Unauthorized({})),
        );
        const session = yield* auth
          .requireUser()
          .pipe(Effect.mapError(() => new HttpApiError.Unauthorized({})));

        if (
          session.authMethod.type === "apiKey" &&
          (session.authMethod.apiKey.configId !== "user" ||
            session.authMethod.apiKey.referenceId !== session.user.id)
        ) {
          return yield* new HttpApiError.Unauthorized({});
        }

        const activeOrganizationId = session.session.activeOrganizationId;
        const activeMember = activeOrganizationId
          ? yield* auth.organizations
              .getActiveMember({
                params: {
                  organizationId: activeOrganizationId,
                  userId: session.user.id,
                },
              })
              .pipe(Effect.mapError(() => new HttpApiError.Unauthorized({})))
          : null;
        const roles = parseRoleList(activeMember?.role);
        const actor =
          session.authMethod.type === "apiKey"
            ? Access.actorForApiKey({
                apiKeyId: session.authMethod.apiKey.id,
                owner: {
                  type: "user",
                  userId: session.user.id,
                  organizationId: activeOrganizationId ?? null,
                  roles,
                },
                grant: yield* Schema.decodeUnknownEffect(ApiKeyPermissionGrant)(
                  session.authMethod.apiKey.permissions ?? {},
                ).pipe(
                  Effect.mapError(() => new HttpApiError.Unauthorized({})),
                ),
              })
            : Access.actorForUser({
                userId: session.user.id,
                organizationId: activeOrganizationId ?? null,
                roles,
              });

        return yield* httpEffect.pipe(
          Effect.provideService(AuthService, auth),
          Effect.provideService(CurrentActor, actor),
        );
      });
  }),
);
