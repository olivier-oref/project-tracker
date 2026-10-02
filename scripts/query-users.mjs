import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { assertDbTarget } from "../src/lib/dbTarget.mjs";

config({ path: ".env.local" });
assertDbTarget(process.env.DATABASE_URL);
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, email, name FROM users`;
console.log(JSON.stringify(rows, null, 2));
