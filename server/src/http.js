import { z } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Envuelve un handler async para que sus errores lleguen al middleware de errores. */
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new HttpError(400, issue?.message ?? 'Datos inválidos.');
  }
  return r.data;
}

export function idParam(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador inválido.');
  return id;
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  // Errores de PostgreSQL traducidos a mensajes útiles.
  switch (err.code) {
    case '23505':
      return res.status(409).json({ error: 'Ya existe un registro con ese valor (duplicado).' });
    case '23503':
      return res.status(409).json({ error: 'El registro está relacionado con otros datos y no se puede modificar o eliminar.' });
    case '23514':
      return res.status(400).json({ error: 'Los datos no cumplen las reglas de validación.' });
    case '22P02':
    case '22007':
    case '22008':
      return res.status(400).json({ error: 'Formato de dato inválido.' });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
}

// ---- Validadores comunes ----
const req = (campo) => ({ error: `${campo} es obligatorio.` });

export const texto = (campo) => z.string(req(campo)).trim().min(1, `${campo} es obligatorio.`);
export const textoOpcional = z.string().trim().default('');
export const fecha = (campo) => z.string(req(campo)).regex(/^\d{4}-\d{2}-\d{2}$/, `${campo} debe ser una fecha válida.`);
export const fechaOpcional = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Fecha inválida.')
  .nullish()
  .transform((v) => v || null);
export const monto = (campo) => z.coerce.number(req(campo)).positive(`${campo} debe ser mayor que cero.`);
export const estado = z.enum(['Activo', 'Inactivo'], { error: 'Estado inválido.' }).default('Activo');
export const ids = z.array(z.coerce.number().int().positive()).default([]);

/** Cédula dominicana: 11 dígitos con dígito verificador (Luhn con pesos 1-2). */
export function cedulaValida(value) {
  const d = String(value ?? '').replace(/\D/g, '');
  if (d.length !== 11) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(d[i]) * (i % 2 === 0 ? 1 : 2);
    if (n > 9) n -= 9;
    sum += n;
  }
  return (10 - (sum % 10)) % 10 === Number(d[10]);
}

export const cedula = z
  .string(req('La cédula'))
  .trim()
  .refine(cedulaValida, 'Cédula inválida (dígito verificador incorrecto).')
  .transform((v) => {
    const d = v.replace(/\D/g, '');
    return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
  });
