import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";
import { assertDbTarget, databaseUrl } from "./dbTarget.mjs";

const connectionString = databaseUrl();
assertDbTarget(connectionString);

export const db = drizzle(neon(connectionString), { schema });
