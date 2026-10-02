import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { assertDbTarget } from "./src/lib/dbTarget.mjs";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;
// Migrating production is deliberate: snapshot first, then run with ALLOW_PROD_DB=1.
assertDbTarget(url);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
