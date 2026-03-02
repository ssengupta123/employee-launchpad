import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function isAzureSql(): boolean {
  return !!(process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_SERVER);
}

const { pool, db } = (() => {
  if (isAzureSql()) {
    return { pool: undefined, db: undefined };
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { pool, db };
})();

export { pool, db };
