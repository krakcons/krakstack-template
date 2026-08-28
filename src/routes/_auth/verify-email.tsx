import { VerifyEmail } from "@krak-stack/auth/components";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/verify-email")({
  component: () => <VerifyEmail />,
});
