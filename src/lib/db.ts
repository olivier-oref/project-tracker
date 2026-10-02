import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";
import { assertDbTarget } from "./dbTarget.mjs";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;
assertDbTarget(connectionString);

export const db = drizzle(neon(connectionString), { schema });
