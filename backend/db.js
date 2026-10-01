import pg from 'pg';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set.\n' +
      '  1. Copy backend/.env.example to backend/.env\n' +
      '  2. Set DATABASE_URL to a local Postgres, or to your Render database "External Database URL" (then DATABASE_SSL=true)'
  );
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Hosted Postgres (Render, Neon, etc.) requires SSL; local Postgres usually doesn't.
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Creates the tasks table on startup if it doesn't exist yet.
export async function initDb() {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}
