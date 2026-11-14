-- Proposition de migration D1; à intégrer aux migrations du WarLike Server
-- L'identité owner_id doit être issue d'une session validée côté serveur.
CREATE TABLE IF NOT EXISTS studio_projects (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_studio_projects_owner_updated
  ON studio_projects(owner_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS studio_assets (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_studio_assets_project ON studio_assets(project_id);
-- Les lectures et modifications doivent vérifier owner_id à chaque route.
-- Exemple d'UPDATE optimiste :
-- UPDATE studio_projects SET snapshot_json=?,revision=revision+1,updated_at=?
-- WHERE id=? AND owner_id=? AND revision=? AND deleted_at IS NULL;
-- Si changes=0 : 404/403 ou conflit 409, sans révéler les données du propriétaire.
