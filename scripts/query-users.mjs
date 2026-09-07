import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, email, name FROM users`;
console.log(JSON.stringify(rows, null, 2));
