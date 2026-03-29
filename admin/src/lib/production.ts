import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: process.env.NEON_DATABASE_URL ? true : false,
});

/**
 * Run a parameterized query against the production Neon PostgreSQL database.
 *
 * Notes:
 *  - Quote the "values" table name (reserved word)
 *  - All production writes go through the sync pipeline
 */
export async function queryProd<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOneProd<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await queryProd<T>(text, params);
  return rows[0] || null;
}

export default pool;
