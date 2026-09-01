import * as BunServices from "@effect/platform-bun/BunServices";
import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";

import initialMigration from "@/db/migrations/0001_initial";

export const migrate = PgMigrator.run({
  loader: PgMigrator.fromRecord({
    "1_initial": initialMigration,
  }),
}).pipe(Effect.provide(BunServices.layer));
