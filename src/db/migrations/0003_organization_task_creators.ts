import { Effect } from "effect";
import { SqlClient } from "effect/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  // Organization API keys create tasks without impersonating a human creator.
  yield* sql`ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL`;
});
