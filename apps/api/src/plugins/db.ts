import fp from "fastify-plugin";
import { createDb, type Database } from "@trading-sim/shared/db";
import { config } from "../config";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export const dbPlugin = fp(async (app) => {
  const db = createDb(config.databaseUrl);
  app.decorate("db", db);
  app.log.info("Database plugin registered");
});
