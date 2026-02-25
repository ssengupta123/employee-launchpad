import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function isAzureSql(): boolean {
  return !!(process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_SERVER);
}

let pool: InstanceType<typeof Pool> | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (!isAzureSql()) {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
