import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type DB = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  company         TEXT,
  email           TEXT,
  phone           TEXT,
  stage           TEXT NOT NULL DEFAULT 'New'
                  CHECK (stage IN ('New','Contacted','Qualified','Proposal','Won','Lost')),
  priority        TEXT NOT NULL DEFAULT 'Medium'
                  CHECK (priority IN ('Low','Medium','High')),
  source          TEXT,
  estimated_value REAL,
  notes           TEXT,
  follow_up_date  TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Done')),
  due_date    TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  description TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  actor       TEXT NOT NULL DEFAULT 'user',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
`;

/** Open (or create) the database. Pass ":memory:" for tests. */
export function openDatabase(path: string): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Additive migrations for databases created by older versions. */
function migrate(db: DB) {
  const cols = (db.prepare("PRAGMA table_info(activities)").all() as { name: string }[]).map((c) => c.name);
  for (const col of ["old_value", "new_value"]) {
    if (!cols.includes(col)) db.exec(`ALTER TABLE activities ADD COLUMN ${col} TEXT`);
  }
}
