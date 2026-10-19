import { PgClient } from "@effect/sql-pg";
import { Config, String } from "effect";

export const databaseLayer = PgClient.layerConfig({
  url: Config.Redacted("DATABASE_URL"),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
});
