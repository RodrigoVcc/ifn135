import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  '../database/migrations/001_schema_inicial.sql',
  '../database/migrations/Inventario.sql',
  '../database/migrations/002_add_subtotal.sql',
];

async function run() {
  for (const file of migrations) {
    try {
      const sql = readFileSync(new URL(file, import.meta.url), 'utf8');
      await pool.query(sql);
      console.log(`Migracion ejecutada: ${file}`);
    } catch (e) {
      console.error(`Error en ${file}: ${e.message}`);
    }
  }
  await pool.end();
  console.log('Todas las migraciones completadas');
}

run();
