import cors from 'cors';
import express from 'express';
import { authRouter, requireAuth } from './auth.js';
import { pool } from './db.js';
import { errorHandler } from './http.js';
import { api } from './routes.js';
import { initDatabase } from './setup.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS_ORIGIN admite varios orígenes separados por coma.
const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map((o) => o.trim());
app.use(cors({ origin: origins, maxAge: 86400 }));
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api', requireAuth, api);
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);

await initDatabase();
app.listen(port, () => console.log(`[api] Talenta RH escuchando en el puerto ${port}`));
