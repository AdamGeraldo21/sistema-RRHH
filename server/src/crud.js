import { Router } from 'express';
import { query } from './db.js';
import { HttpError, h, idParam, parse } from './http.js';

/**
 * Rutas REST (GET, POST, PUT, PATCH, DELETE) para una tabla simple.
 * `columns` mapea el nombre en la API (camelCase) a la columna SQL; `select` permite expresiones propias.
 */
export function crud({ table, columns, schema, select = {}, orderBy = 'id' }) {
  const fields = Object.keys(columns);
  const selectList = ['id', ...fields.map((f) => `${select[f] ?? columns[f]} AS "${f}"`)].join(', ');
  const router = Router();

  const one = async (id) => {
    const { rows } = await query(`SELECT ${selectList} FROM ${table} WHERE id = $1`, [id]);
    if (!rows[0]) throw new HttpError(404, 'Registro no encontrado.');
    return rows[0];
  };

  router.get(
    '/',
    h(async (_req, res) => {
      const { rows } = await query(`SELECT ${selectList} FROM ${table} ORDER BY ${orderBy}`);
      res.json(rows);
    }),
  );

  router.get(
    '/:id',
    h(async (req, res) => res.json(await one(idParam(req)))),
  );

  router.post(
    '/',
    h(async (req, res) => {
      const body = parse(schema, req.body);
      const cols = fields.filter((f) => f in body);
      const { rows } = await query(
        `INSERT INTO ${table} (${cols.map((f) => columns[f]).join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
        cols.map((f) => body[f]),
      );
      res.status(201).json(await one(rows[0].id));
    }),
  );

  const update = (partial) =>
    h(async (req, res) => {
      const id = idParam(req);
      // PATCH valida solo los campos enviados contra el registro actual completo.
      const current = partial ? await one(id) : {};
      const body = parse(schema, partial ? { ...current, ...req.body } : req.body);
      const cols = fields.filter((f) => f in body && (!partial || f in req.body));
      if (!cols.length) return res.json(await one(id));
      const { rowCount } = await query(
        `UPDATE ${table} SET ${cols.map((f, i) => `${columns[f]} = $${i + 1}`).join(', ')} WHERE id = $${cols.length + 1}`,
        [...cols.map((f) => body[f]), id],
      );
      if (!rowCount) throw new HttpError(404, 'Registro no encontrado.');
      res.json(await one(id));
    });

  router.put('/:id', update(false));
  router.patch('/:id', update(true));

  router.delete(
    '/:id',
    h(async (req, res) => {
      const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [idParam(req)]);
      if (!rowCount) throw new HttpError(404, 'Registro no encontrado.');
      res.status(204).end();
    }),
  );

  return router;
}
