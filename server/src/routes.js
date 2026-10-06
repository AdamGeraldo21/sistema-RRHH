import { Router } from 'express';
import { z } from 'zod';
import { USER_COLUMNS, email, hashPassword, password, requireAdmin } from './auth.js';
import { crud } from './crud.js';
import { query, tx } from './db.js';
import { HttpError, cedula, estado, fecha, fechaOpcional, h, idParam, ids, monto, parse, texto, textoOpcional } from './http.js';
import { resetHr } from './setup.js';

export const api = Router();

// ---------- Catálogos ----------
api.use(
  '/competencias',
  crud({
    table: 'competencias',
    columns: { descripcion: 'descripcion', tipo: 'tipo', estado: 'estado' },
    schema: z.object({
      descripcion: texto('La descripción'),
      tipo: z.enum(['Organizacional', 'Técnica', 'Operativa', 'Gerencial'], { error: 'Tipo inválido.' }),
      estado,
    }),
  }),
);

api.use(
  '/idiomas',
  crud({
    table: 'idiomas',
    columns: { nombre: 'nombre', estado: 'estado' },
    schema: z.object({ nombre: texto('El nombre'), estado }),
  }),
);

api.use(
  '/capacitaciones',
  crud({
    table: 'capacitaciones',
    columns: { descripcion: 'descripcion', nivel: 'nivel', fechaDesde: 'fecha_desde', fechaHasta: 'fecha_hasta', institucion: 'institucion' },
    schema: z
      .object({
        descripcion: texto('La descripción'),
        nivel: z.enum(['Grado', 'Post-grado', 'Maestría', 'Doctorado', 'Técnico', 'Gestión'], { error: 'Nivel inválido.' }),
        fechaDesde: fecha('La fecha desde'),
        fechaHasta: fecha('La fecha hasta'),
        institucion: texto('La institución'),
      })
      .refine((d) => d.fechaHasta >= d.fechaDesde, 'La fecha hasta no puede ser anterior a la fecha desde.'),
  }),
);

api.use(
  '/puestos',
  crud({
    table: 'puestos',
    columns: {
      nombre: 'nombre',
      departamento: 'departamento',
      riesgo: 'riesgo',
      salarioMin: 'salario_min',
      salarioMax: 'salario_max',
      estado: 'estado',
    },
    schema: z
      .object({
        nombre: texto('El nombre'),
        departamento: texto('El departamento'),
        riesgo: z.enum(['Alto', 'Medio', 'Bajo'], { error: 'Nivel de riesgo inválido.' }),
        salarioMin: monto('El salario mínimo'),
        salarioMax: monto('El salario máximo'),
        estado,
      })
      .refine((d) => d.salarioMax >= d.salarioMin, 'El salario máximo debe ser mayor o igual al mínimo.'),
  }),
);

// ---------- Experiencia laboral ----------
const experienciaSchema = z
  .object({
    empresa: texto('La empresa'),
    puesto: texto('El puesto'),
    fechaDesde: fecha('La fecha desde'),
    fechaHasta: fechaOpcional,
    salario: z.coerce.number().min(0, 'El salario no puede ser negativo.').default(0),
  })
  .refine((d) => !d.fechaHasta || d.fechaHasta >= d.fechaDesde, 'La fecha hasta no puede ser anterior a la fecha desde.');

api.use(
  '/experiencias',
  crud({
    table: 'experiencias',
    columns: {
      candidatoId: 'candidato_id',
      empresa: 'empresa',
      puesto: 'puesto',
      fechaDesde: 'fecha_desde',
      fechaHasta: 'fecha_hasta',
      salario: 'salario',
    },
    select: { fechaHasta: `COALESCE(fecha_hasta::text, '')` },
    orderBy: 'fecha_desde DESC, id',
    schema: experienciaSchema.and(z.object({ candidatoId: z.coerce.number({ error: 'Selecciona el candidato.' }).int().positive('Selecciona el candidato.') })),
  }),
);

// ---------- Empleados ----------
api.use(
  '/empleados',
  crud({
    table: 'empleados',
    columns: {
      cedula: 'cedula',
      nombre: 'nombre',
      fechaIngreso: 'fecha_ingreso',
      departamento: 'departamento',
      puestoId: 'puesto_id',
      salario: 'salario',
      estado: 'estado',
      candidatoId: 'candidato_id',
    },
    orderBy: 'fecha_ingreso DESC, id',
    schema: z.object({
      cedula,
      nombre: texto('El nombre'),
      fechaIngreso: fecha('La fecha de ingreso'),
      departamento: texto('El departamento'),
      puestoId: z.coerce.number({ error: 'Selecciona el puesto.' }).int().positive('Selecciona el puesto.'),
      salario: monto('El salario'),
      estado,
    }),
  }),
);

// ---------- Candidatos ----------
const CANDIDATO_SELECT = `
  SELECT c.id, c.cedula, c.nombre, c.email, c.telefono, c.puesto_id AS "puestoId", c.departamento,
         c.salario_aspira AS "salarioAspira", c.recomendado_por AS "recomendadoPor", c.etapa,
         c.fecha_postulacion AS "fechaPostulacion",
         COALESCE((SELECT array_agg(competencia_id ORDER BY competencia_id) FROM candidato_competencias WHERE candidato_id = c.id), '{}') AS competencias,
         COALESCE((SELECT array_agg(capacitacion_id ORDER BY capacitacion_id) FROM candidato_capacitaciones WHERE candidato_id = c.id), '{}') AS capacitaciones,
         COALESCE((SELECT array_agg(idioma_id ORDER BY idioma_id) FROM candidato_idiomas WHERE candidato_id = c.id), '{}') AS idiomas
  FROM candidatos c`;

const ETAPAS = ['Postulado', 'Entrevista', 'Evaluación', 'Oferta', 'Contratado', 'Descartado'];

const candidatoSchema = z.object({
  cedula,
  nombre: texto('El nombre'),
  email: z.union([z.literal(''), z.string().trim().email('El correo electrónico no es válido.')]).default(''),
  telefono: textoOpcional,
  puestoId: z.coerce.number({ error: 'Selecciona el puesto al que aspira.' }).int().positive('Selecciona el puesto al que aspira.'),
  departamento: textoOpcional,
  salarioAspira: monto('El salario al que aspira'),
  recomendadoPor: textoOpcional,
  etapa: z.enum(ETAPAS, { error: 'Etapa inválida.' }).default('Postulado'),
  fechaPostulacion: fecha('La fecha de postulación'),
  competencias: ids,
  capacitaciones: ids,
  idiomas: ids,
  /** Si se envía, reemplaza toda la experiencia laboral del candidato. */
  experiencias: z.array(experienciaSchema).optional(),
});

async function getCandidato(id, db = { query }) {
  const { rows } = await db.query(`${CANDIDATO_SELECT} WHERE c.id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Candidato no encontrado.');
  return rows[0];
}

async function saveRelations(client, id, body) {
  await client.query('DELETE FROM candidato_competencias WHERE candidato_id = $1', [id]);
  await client.query('DELETE FROM candidato_capacitaciones WHERE candidato_id = $1', [id]);
  await client.query('DELETE FROM candidato_idiomas WHERE candidato_id = $1', [id]);
  await client.query('INSERT INTO candidato_competencias SELECT $1, unnest($2::int[])', [id, [...new Set(body.competencias)]]);
  await client.query('INSERT INTO candidato_capacitaciones SELECT $1, unnest($2::int[])', [id, [...new Set(body.capacitaciones)]]);
  await client.query('INSERT INTO candidato_idiomas SELECT $1, unnest($2::int[])', [id, [...new Set(body.idiomas)]]);
  if (body.experiencias) {
    await client.query('DELETE FROM experiencias WHERE candidato_id = $1', [id]);
    for (const e of body.experiencias) {
      await client.query('INSERT INTO experiencias (candidato_id, empresa, puesto, fecha_desde, fecha_hasta, salario) VALUES ($1, $2, $3, $4, $5, $6)', [
        id,
        e.empresa,
        e.puesto,
        e.fechaDesde,
        e.fechaHasta,
        e.salario,
      ]);
    }
  }
}

const candidatoValues = (b) => [b.cedula, b.nombre, b.email, b.telefono, b.puestoId, b.departamento, b.salarioAspira, b.recomendadoPor, b.etapa, b.fechaPostulacion];

api.get(
  '/candidatos',
  h(async (_req, res) => {
    const { rows } = await query(`${CANDIDATO_SELECT} ORDER BY c.fecha_postulacion DESC, c.id`);
    res.json(rows);
  }),
);

api.get(
  '/candidatos/:id',
  h(async (req, res) => res.json(await getCandidato(idParam(req)))),
);

api.post(
  '/candidatos',
  h(async (req, res) => {
    const body = parse(candidatoSchema, req.body);
    if (body.etapa === 'Contratado') throw new HttpError(400, 'Para contratar usa el proceso de selección.');
    const saved = await tx(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO candidatos (cedula, nombre, email, telefono, puesto_id, departamento, salario_aspira, recomendado_por, etapa, fecha_postulacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        candidatoValues(body),
      );
      await saveRelations(client, rows[0].id, body);
      return getCandidato(rows[0].id, client);
    });
    res.status(201).json(saved);
  }),
);

api.put(
  '/candidatos/:id',
  h(async (req, res) => {
    const id = idParam(req);
    const body = parse(candidatoSchema, req.body);
    const actual = await getCandidato(id);
    if (actual.etapa === 'Contratado') body.etapa = 'Contratado';
    else if (body.etapa === 'Contratado') throw new HttpError(400, 'Para contratar usa el proceso de selección.');
    const saved = await tx(async (client) => {
      await client.query(
        `UPDATE candidatos SET cedula = $1, nombre = $2, email = $3, telefono = $4, puesto_id = $5, departamento = $6,
         salario_aspira = $7, recomendado_por = $8, etapa = $9, fecha_postulacion = $10 WHERE id = $11`,
        [...candidatoValues(body), id],
      );
      await saveRelations(client, id, body);
      return getCandidato(id, client);
    });
    res.json(saved);
  }),
);

/** Cambio de etapa en el proceso de selección. */
api.patch(
  '/candidatos/:id/etapa',
  h(async (req, res) => {
    const id = idParam(req);
    const { etapa } = parse(z.object({ etapa: z.enum(ETAPAS, { error: 'Etapa inválida.' }) }), req.body);
    if (etapa === 'Contratado') throw new HttpError(400, 'Usa la acción Contratar para convertir al candidato en empleado.');
    const actual = await getCandidato(id);
    if (actual.etapa === 'Contratado') throw new HttpError(409, 'El candidato ya fue contratado como empleado.');
    await query('UPDATE candidatos SET etapa = $1 WHERE id = $2', [etapa, id]);
    res.json(await getCandidato(id));
  }),
);

api.delete(
  '/candidatos/:id',
  h(async (req, res) => {
    const id = idParam(req);
    const actual = await getCandidato(id);
    if (actual.etapa === 'Contratado') throw new HttpError(409, 'El candidato ya fue contratado como empleado.');
    await query('DELETE FROM candidatos WHERE id = $1', [id]);
    res.status(204).end();
  }),
);

/** Proceso de selección: convierte al candidato en empleado (transacción). */
api.post(
  '/candidatos/:id/contratar',
  h(async (req, res) => {
    const id = idParam(req);
    const body = parse(
      z.object({
        fechaIngreso: fecha('La fecha de ingreso'),
        puestoId: z.coerce.number({ error: 'Selecciona el puesto.' }).int().positive('Selecciona el puesto.'),
        departamento: texto('El departamento'),
        salario: monto('El salario'),
      }),
      req.body,
    );
    const result = await tx(async (client) => {
      const c = await getCandidato(id, client);
      if (c.etapa === 'Contratado') throw new HttpError(409, 'El candidato ya fue contratado.');
      const { rows: p } = await client.query('SELECT salario_min AS min, salario_max AS max, estado FROM puestos WHERE id = $1', [body.puestoId]);
      if (!p[0]) throw new HttpError(400, 'El puesto no existe.');
      if (p[0].estado !== 'Activo') throw new HttpError(400, 'El puesto está inactivo.');
      if (body.salario < p[0].min || body.salario > p[0].max) throw new HttpError(400, 'El salario debe estar dentro de la banda del puesto.');
      const { rows: dup } = await client.query('SELECT 1 FROM empleados WHERE cedula = $1', [c.cedula]);
      if (dup[0]) throw new HttpError(409, 'Ya existe un empleado con esta cédula.');
      const { rows: emp } = await client.query(
        `INSERT INTO empleados (cedula, nombre, fecha_ingreso, departamento, puesto_id, salario, estado, candidato_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'Activo', $7)
         RETURNING id, cedula, nombre, fecha_ingreso AS "fechaIngreso", departamento, puesto_id AS "puestoId", salario, estado, candidato_id AS "candidatoId"`,
        [c.cedula, c.nombre, body.fechaIngreso, body.departamento, body.puestoId, body.salario, c.id],
      );
      await client.query(`UPDATE candidatos SET etapa = 'Contratado', puesto_id = $1, departamento = $2 WHERE id = $3`, [
        body.puestoId,
        body.departamento,
        c.id,
      ]);
      return { empleado: emp[0], candidato: await getCandidato(c.id, client) };
    });
    res.status(201).json(result);
  }),
);

// ---------- Usuarios (solo administradores) ----------
const usuarios = Router();
usuarios.use(requireAdmin);

const usuarioSchema = z.object({
  nombre: texto('El nombre'),
  email,
  password: z.union([z.literal(''), password]).optional(),
  rol: z.enum(['Administrador', 'Reclutador'], { error: 'Rol inválido.' }),
  estado,
});

/** Verifica que, tras el cambio, quede al menos un administrador activo. */
async function assertAdminRemains(client, excludeId) {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM usuarios WHERE rol = 'Administrador' AND estado = 'Activo' AND id <> $1`, [excludeId]);
  if (rows[0].n === 0) throw new HttpError(409, 'Debe quedar al menos un administrador activo.');
}

const emailDup = (err) => {
  if (err.code === '23505') throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  throw err;
};

usuarios.get(
  '/',
  h(async (_req, res) => {
    const { rows } = await query(`SELECT ${USER_COLUMNS} FROM usuarios ORDER BY id`);
    res.json(rows);
  }),
);

usuarios.post(
  '/',
  h(async (req, res) => {
    const body = parse(usuarioSchema, req.body);
    if (!body.password) throw new HttpError(400, 'La contraseña es obligatoria.');
    const { rows } = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLUMNS}`,
      [body.nombre, body.email, await hashPassword(body.password), body.rol, body.estado],
    ).catch(emailDup);
    res.status(201).json(rows[0]);
  }),
);

usuarios.put(
  '/:id',
  h(async (req, res) => {
    const id = idParam(req);
    const body = parse(usuarioSchema, req.body);
    if (id === req.user.id && (body.rol !== 'Administrador' || body.estado !== 'Activo')) {
      throw new HttpError(400, 'No puedes cambiar tu propio rol ni desactivar tu cuenta.');
    }
    const saved = await tx(async (client) => {
      const params = [body.nombre, body.email, body.rol, body.estado, id];
      let sql = `UPDATE usuarios SET nombre = $1, email = $2, rol = $3, estado = $4`;
      if (body.password) {
        params.push(await hashPassword(body.password));
        sql += `, password_hash = $${params.length}`;
      }
      const { rows } = await client.query(`${sql} WHERE id = $5 RETURNING ${USER_COLUMNS}`, params).catch(emailDup);
      if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado.');
      if (body.rol !== 'Administrador' || body.estado !== 'Activo') await assertAdminRemains(client, id);
      return rows[0];
    });
    res.json(saved);
  }),
);

usuarios.delete(
  '/:id',
  h(async (req, res) => {
    const id = idParam(req);
    if (id === req.user.id) throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');
    await tx(async (client) => {
      const { rowCount } = await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      if (!rowCount) throw new HttpError(404, 'Usuario no encontrado.');
      await assertAdminRemains(client, id);
    });
    res.status(204).end();
  }),
);

api.use('/usuarios', usuarios);

// ---------- Administración ----------
api.post(
  '/admin/reset',
  requireAdmin,
  h(async (_req, res) => {
    await resetHr();
    res.status(204).end();
  }),
);
