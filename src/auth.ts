import { HttpServerRequest } from "effect/unstable/http";

export type AuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image: string | null;
  readonly emailVerified: boolean;
};

export type UserSession = {
  readonly user: AuthUser;
  readonly activeOrganizationId?: string;
};

export type OrganizationSummary = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type ApiKeySummary = {
  readonly id: string;
  readonly name: string | null;
  readonly enabled: boolean;
  readonly start: string | null;
};

type IncomingRequest = Request | HttpServerRequest.HttpServerRequest;

const toWebRequest = (request: IncomingRequest) =>
  request instanceof Request ? request : (request.source as Request);

export const absoluteUrl = (request: IncomingRequest, path: string) =>
  new URL(path, toWebRequest(request).url).href;
