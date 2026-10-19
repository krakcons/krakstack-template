import * as BunServices from "@effect/platform-bun/BunServices";
import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";

import initialMigration from "@/db/migrations/0001_initial";
import organizationTasks from "@/db/migrations/0002_organization_tasks";
import organizationTaskCreators from "@/db/migrations/0003_organization_task_creators";

export const migrate = PgMigrator.run({
  loader: PgMigrator.fromRecord({
    "1_initial": initialMigration,
    "2_organization_tasks": organizationTasks,
    "3_organization_task_creators": organizationTaskCreators,
  }),
}).pipe(Effect.provide(BunServices.layer));
