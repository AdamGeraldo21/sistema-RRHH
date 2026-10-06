import pg from 'pg';

// DATE → 'YYYY-MM-DD' (sin conversión de zona horaria) y NUMERIC → number.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

// Render exige SSL en conexiones externas; la URL interna (host sin puntos) y localhost no lo usan.
const host = new URL(connectionString).hostname;
const local = host === 'localhost' || host === '127.0.0.1' || !host.includes('.');

export const pool = new pg.Pool({
  connectionString,
  ssl: local ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX ?? 5),
});

export const query = (text, params) => pool.query(text, params);

/** Ejecuta `fn` dentro de una transacción y devuelve su resultado. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
