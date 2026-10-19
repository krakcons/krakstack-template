import {
  defineProjectAccess,
  defineProjectAccessLabels,
} from "@krak-stack/auth/access";

import { m } from "@/paraglide/messages";

export const Access = defineProjectAccess({
  project: "krakstack-template",
  permissions: [
    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",
    "audit:read",
  ],
  roles: {
    owner: [
      "tasks:read",
      "tasks:create",
      "tasks:update",
      "tasks:delete",
      "audit:read",
    ],
    admin: [
      "tasks:read",
      "tasks:create",
      "tasks:update",
      "tasks:delete",
      "audit:read",
    ],
    support: ["tasks:read"],
    member: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
  },
  apiKeys: {
    user: [
      "tasks:read",
      "tasks:create",
      "tasks:update",
      "tasks:delete",
      "audit:read",
    ],
    organization: [
      "tasks:read",
      "tasks:create",
      "tasks:update",
      "tasks:delete",
    ],
  },
});

export const AccessLabels = defineProjectAccessLabels(Access, {
  project: m.docs_permissions_project(),
  roles: {
    owner: m.docs_permissions_role_owner(),
    admin: m.docs_permissions_role_admin(),
    support: m.docs_permissions_role_support(),
    member: m.docs_permissions_role_member(),
  },
  permissions: {
    audit: {
      label: m.audit_title(),
      actions: { read: m.docs_permissions_action_read() },
    },
    tasks: {
      label: m.docs_permissions_resource_tasks(),
      actions: {
        read: m.docs_permissions_action_read(),
        create: m.docs_permissions_action_create(),
        update: m.docs_permissions_action_update(),
        delete: m.docs_permissions_action_delete(),
      },
    },
  },
});
