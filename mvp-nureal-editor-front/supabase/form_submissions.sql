-- Tabela de submissões de formulário
CREATE TABLE IF NOT EXISTS form_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_id     text NOT NULL,
  form_id     text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_project ON form_submissions(project_id, created_at DESC);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir (formulários públicos)
CREATE POLICY "form_submissions_public_insert"
  ON form_submissions FOR INSERT
  WITH CHECK (true);

-- Apenas o dono do projeto pode ler
CREATE POLICY "form_submissions_owner_select"
  ON form_submissions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Apenas o dono pode deletar
CREATE POLICY "form_submissions_owner_delete"
  ON form_submissions FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
