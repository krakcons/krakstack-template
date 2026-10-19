import { Effect } from "effect";
import { SqlClient } from "effect/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`ALTER TABLE tasks ADD COLUMN organization_id text`;
  // Existing tasks are disposable demo data. Never infer a tenant from their creator.
  yield* sql`DELETE FROM tasks WHERE organization_id IS NULL`;
  yield* sql`ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL`;
  yield* sql`CREATE INDEX tasks_organization_created ON tasks (organization_id, created_at)`;
});
