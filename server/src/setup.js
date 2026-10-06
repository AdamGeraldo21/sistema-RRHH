import bcrypt from 'bcryptjs';
import { readFile } from 'node:fs/promises';
import { pool, tx } from './db.js';

const schemaUrl = new URL('./schema.sql', import.meta.url);
const seedUrl = new URL('./seed-data.json', import.meta.url);

const HR_TABLES = [
  'empleados',
  'experiencias',
  'candidato_idiomas',
  'candidato_capacitaciones',
  'candidato_competencias',
  'candidatos',
  'puestos',
  'capacitaciones',
  'idiomas',
  'competencias',
];

export const DEMO_USERS = [
  { nombre: 'Adam Geraldo', email: 'admin@talenta.do', password: 'admin123', rol: 'Administrador', creado: '2026-01-05' },
  { nombre: 'Ana Taveras', email: 'reclutador@talenta.do', password: 'demo123', rol: 'Reclutador', creado: '2026-03-12' },
];

export async function applySchema() {
  await pool.query(await readFile(schemaUrl, 'utf8'));
}

/** Inserta filas conservando sus id y ajusta la secuencia SERIAL. */
async function insertRows(client, table, columns, rows) {
  for (const row of rows) {
    const cols = Object.keys(columns);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      cols.map((c) => {
        const v = row[columns[c]];
        return v === '' && c.startsWith('fecha') ? null : v;
      }),
    );
  }
  await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
}

async function seedHr(client) {
  const d = JSON.parse(await readFile(seedUrl, 'utf8'));
  await insertRows(client, 'competencias', { id: 'id', descripcion: 'descripcion', tipo: 'tipo', estado: 'estado' }, d.competencias);
  await insertRows(client, 'idiomas', { id: 'id', nombre: 'nombre', estado: 'estado' }, d.idiomas);
  await insertRows(
    client,
    'capacitaciones',
    { id: 'id', descripcion: 'descripcion', nivel: 'nivel', fecha_desde: 'fechaDesde', fecha_hasta: 'fechaHasta', institucion: 'institucion' },
    d.capacitaciones,
  );
  await insertRows(
    client,
    'puestos',
    { id: 'id', nombre: 'nombre', departamento: 'departamento', riesgo: 'riesgo', salario_min: 'salarioMin', salario_max: 'salarioMax', estado: 'estado' },
    d.puestos,
  );
  await insertRows(
    client,
    'candidatos',
    {
      id: 'id',
      cedula: 'cedula',
      nombre: 'nombre',
      email: 'email',
      telefono: 'telefono',
      puesto_id: 'puestoId',
      departamento: 'departamento',
      salario_aspira: 'salarioAspira',
      recomendado_por: 'recomendadoPor',
      etapa: 'etapa',
      fecha_postulacion: 'fechaPostulacion',
    },
    d.candidatos,
  );
  for (const c of d.candidatos) {
    for (const id of c.competencias) await client.query('INSERT INTO candidato_competencias VALUES ($1, $2)', [c.id, id]);
    for (const id of c.capacitaciones) await client.query('INSERT INTO candidato_capacitaciones VALUES ($1, $2)', [c.id, id]);
    for (const id of c.idiomas) await client.query('INSERT INTO candidato_idiomas VALUES ($1, $2)', [c.id, id]);
  }
  await insertRows(
    client,
    'experiencias',
    { id: 'id', candidato_id: 'candidatoId', empresa: 'empresa', puesto: 'puesto', fecha_desde: 'fechaDesde', fecha_hasta: 'fechaHasta', salario: 'salario' },
    d.experiencias,
  );
  await insertRows(
    client,
    'empleados',
    {
      id: 'id',
      cedula: 'cedula',
      nombre: 'nombre',
      fecha_ingreso: 'fechaIngreso',
      departamento: 'departamento',
      puesto_id: 'puestoId',
      salario: 'salario',
      estado: 'estado',
      candidato_id: 'candidatoId',
    },
    d.empleados.map((e) => ({ ...e, candidatoId: e.candidatoId ?? null })),
  );
}

/** Crea el esquema y carga los datos de demostración si la base está vacía. */
export async function initDatabase() {
  await applySchema();
  const { rows } = await pool.query('SELECT (SELECT COUNT(*) FROM usuarios)::int AS u, (SELECT COUNT(*) FROM puestos)::int AS p');
  await tx(async (client) => {
    if (rows[0].u === 0) {
      for (const u of DEMO_USERS) {
        await client.query('INSERT INTO usuarios (nombre, email, password_hash, rol, creado) VALUES ($1, $2, $3, $4, $5)', [
          u.nombre,
          u.email,
          await bcrypt.hash(u.password, 10),
          u.rol,
          u.creado,
        ]);
      }
      console.log('[db] usuarios de demostración creados');
    }
    if (rows[0].p === 0) {
      await seedHr(client);
      console.log('[db] datos de RH de demostración cargados');
    }
  });
}

/** Borra los datos de RH y vuelve a cargar los de demostración (no toca usuarios). */
export async function resetHr() {
  await tx(async (client) => {
    await client.query(`TRUNCATE ${HR_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    await seedHr(client);
  });
}
