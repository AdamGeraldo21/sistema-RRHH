-- Talenta RH · esquema PostgreSQL (idempotente: se puede ejecutar en cada arranque)

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('Administrador', 'Reclutador')),
  estado        TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  creado        DATE NOT NULL DEFAULT CURRENT_DATE,
  ultimo_acceso TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_uq ON usuarios (lower(email));

CREATE TABLE IF NOT EXISTS competencias (
  id          SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('Organizacional', 'Técnica', 'Operativa', 'Gerencial')),
  estado      TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);
CREATE UNIQUE INDEX IF NOT EXISTS competencias_desc_uq ON competencias (lower(descripcion));

CREATE TABLE IF NOT EXISTS idiomas (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idiomas_nombre_uq ON idiomas (lower(nombre));

CREATE TABLE IF NOT EXISTS capacitaciones (
  id          SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  nivel       TEXT NOT NULL CHECK (nivel IN ('Grado', 'Post-grado', 'Maestría', 'Doctorado', 'Técnico', 'Gestión')),
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  institucion TEXT NOT NULL,
  CHECK (fecha_hasta >= fecha_desde)
);

CREATE TABLE IF NOT EXISTS puestos (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  departamento TEXT NOT NULL,
  riesgo       TEXT NOT NULL CHECK (riesgo IN ('Alto', 'Medio', 'Bajo')),
  salario_min  NUMERIC(12, 2) NOT NULL CHECK (salario_min > 0),
  salario_max  NUMERIC(12, 2) NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  CHECK (salario_max >= salario_min)
);

CREATE TABLE IF NOT EXISTS candidatos (
  id                SERIAL PRIMARY KEY,
  cedula            TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  email             TEXT NOT NULL DEFAULT '',
  telefono          TEXT NOT NULL DEFAULT '',
  puesto_id         INTEGER NOT NULL REFERENCES puestos (id),
  departamento      TEXT NOT NULL DEFAULT '',
  salario_aspira    NUMERIC(12, 2) NOT NULL CHECK (salario_aspira > 0),
  recomendado_por   TEXT NOT NULL DEFAULT '',
  etapa             TEXT NOT NULL DEFAULT 'Postulado'
                    CHECK (etapa IN ('Postulado', 'Entrevista', 'Evaluación', 'Oferta', 'Contratado', 'Descartado')),
  fecha_postulacion DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS candidato_competencias (
  candidato_id   INTEGER NOT NULL REFERENCES candidatos (id) ON DELETE CASCADE,
  competencia_id INTEGER NOT NULL REFERENCES competencias (id),
  PRIMARY KEY (candidato_id, competencia_id)
);

CREATE TABLE IF NOT EXISTS candidato_capacitaciones (
  candidato_id     INTEGER NOT NULL REFERENCES candidatos (id) ON DELETE CASCADE,
  capacitacion_id  INTEGER NOT NULL REFERENCES capacitaciones (id),
  PRIMARY KEY (candidato_id, capacitacion_id)
);

CREATE TABLE IF NOT EXISTS candidato_idiomas (
  candidato_id INTEGER NOT NULL REFERENCES candidatos (id) ON DELETE CASCADE,
  idioma_id    INTEGER NOT NULL REFERENCES idiomas (id),
  PRIMARY KEY (candidato_id, idioma_id)
);

CREATE TABLE IF NOT EXISTS experiencias (
  id           SERIAL PRIMARY KEY,
  candidato_id INTEGER NOT NULL REFERENCES candidatos (id) ON DELETE CASCADE,
  empresa      TEXT NOT NULL,
  puesto       TEXT NOT NULL,
  fecha_desde  DATE NOT NULL,
  fecha_hasta  DATE,
  salario      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (salario >= 0),
  CHECK (fecha_hasta IS NULL OR fecha_hasta >= fecha_desde)
);
CREATE INDEX IF NOT EXISTS experiencias_candidato_idx ON experiencias (candidato_id);

CREATE TABLE IF NOT EXISTS empleados (
  id            SERIAL PRIMARY KEY,
  cedula        TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL,
  fecha_ingreso DATE NOT NULL,
  departamento  TEXT NOT NULL,
  puesto_id     INTEGER NOT NULL REFERENCES puestos (id),
  salario       NUMERIC(12, 2) NOT NULL CHECK (salario > 0),
  estado        TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  candidato_id  INTEGER REFERENCES candidatos (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS empleados_fecha_ingreso_idx ON empleados (fecha_ingreso);
