import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from './db.js';
import { HttpError, h, parse, texto } from './http.js';

const SECRET = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? null : 'dev-secret-solo-local');
if (!SECRET) throw new Error('Falta la variable de entorno JWT_SECRET');

export const USER_COLUMNS = `id, nombre, email, rol, estado, creado, ultimo_acceso AS "ultimoAcceso"`;

export const email = z.string({ error: 'El correo es obligatorio.' }).trim().toLowerCase().email('El correo electrónico no es válido.');
export const password = z.string({ error: 'La contraseña es obligatoria.' }).min(6, 'La contraseña debe tener al menos 6 caracteres.').max(100);

export const hashPassword = (plain) => bcrypt.hash(plain, 10);

function sign(user, remember) {
  return jwt.sign({ sub: user.id, rol: user.rol }, SECRET, { expiresIn: remember ? '7d' : '12h' });
}

/** Verifica el token y carga el usuario (debe seguir activo). */
export const requireAuth = h(async (req, _res, next) => {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Sesión requerida.');
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    throw new HttpError(401, 'La sesión expiró. Inicia sesión nuevamente.');
  }
  const { rows } = await query(`SELECT ${USER_COLUMNS} FROM usuarios WHERE id = $1`, [payload.sub]);
  const user = rows[0];
  if (!user || user.estado !== 'Activo') throw new HttpError(401, 'La cuenta no está disponible.');
  req.user = user;
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.rol !== 'Administrador') return next(new HttpError(403, 'Solo los administradores pueden realizar esta acción.'));
  next();
}

export const authRouter = Router();

// Limita intentos de login/registro por IP.
authRouter.use(['/login', '/register'], rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

authRouter.post(
  '/login',
  h(async (req, res) => {
    const body = parse(z.object({ email, password: z.string().min(1, 'Ingresa tu contraseña.'), remember: z.boolean().default(true) }), req.body);
    const { rows } = await query(`SELECT ${USER_COLUMNS}, password_hash FROM usuarios WHERE lower(email) = $1`, [body.email]);
    const row = rows[0];
    if (!row || !(await bcrypt.compare(body.password, row.password_hash))) throw new HttpError(401, 'Correo o contraseña incorrectos.');
    if (row.estado !== 'Activo') throw new HttpError(403, 'Esta cuenta está inactiva. Contacta a un administrador.');
    const { rows: upd } = await query(`UPDATE usuarios SET ultimo_acceso = now() WHERE id = $1 RETURNING ${USER_COLUMNS}`, [row.id]);
    res.json({ token: sign(upd[0], body.remember), user: upd[0] });
  }),
);

/** Registro público: siempre crea una cuenta con rol Reclutador. */
authRouter.post(
  '/register',
  h(async (req, res) => {
    const body = parse(z.object({ nombre: texto('El nombre'), email, password }), req.body);
    const { rows } = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, ultimo_acceso)
       VALUES ($1, $2, $3, 'Reclutador', now()) RETURNING ${USER_COLUMNS}`,
      [body.nombre, body.email, await hashPassword(body.password)],
    ).catch((err) => {
      if (err.code === '23505') throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
      throw err;
    });
    res.status(201).json({ token: sign(rows[0], true), user: rows[0] });
  }),
);

authRouter.get('/me', requireAuth, (req, res) => res.json(req.user));
