// Crea el esquema (si falta) y recarga los datos de RH de demostración. Uso: npm run db:reset
import { pool } from './db.js';
import { initDatabase, resetHr } from './setup.js';

await initDatabase();
await resetHr();
console.log('[db] datos de RH restablecidos');
await pool.end();
