import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

export function createDb(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return drizzle(pool, { schema });
}

export * from "./schema";
