import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./index";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Running migrations...");
  const db = createDb(connectionString);

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations complete!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
