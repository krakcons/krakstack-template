import { VerifyEmail } from "@krak-stack/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/verify-email")({
  component: () => <VerifyEmail />,
});
