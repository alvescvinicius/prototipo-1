-- ── Objetos globais por conta ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nureal_objects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,   -- slug: "solicitacao"
  label      text NOT NULL,   -- display: "Solicitação"
  fields     jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE nureal_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nureal_objects_owner"
  ON nureal_objects FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Registros genéricos de objetos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS object_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,          -- dono do objeto (para RLS de leitura)
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  object_name text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_object_records_user  ON object_records(user_id, object_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_object_records_proj  ON object_records(project_id, created_at DESC);

ALTER TABLE object_records ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir (formulários públicos)
CREATE POLICY "object_records_public_insert"
  ON object_records FOR INSERT
  WITH CHECK (true);

-- Dono lê e deleta seus registros
CREATE POLICY "object_records_owner_select"
  ON object_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "object_records_owner_delete"
  ON object_records FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "object_records_owner_update"
  ON object_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
