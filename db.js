import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// DB_PATH can be overridden with an environment variable (e.g. a persistent
// disk path). By default the database file lives in server/data/.
const dbPath = process.env.DB_PATH || path.join(here, "data", "capsules.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// The table is created automatically on first start, so there is no
// separate migration step to run (important for a fresh Render deploy).
db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          TEXT NOT NULL,
    project_name     TEXT NOT NULL,
    prompt_title     TEXT NOT NULL,
    prompt_version   TEXT,
    prompt_text      TEXT NOT NULL,
    response_summary TEXT,
    category         TEXT,
    usefulness       TEXT,
    reviewed         INTEGER DEFAULT 0,
    improved         INTEGER DEFAULT 0,
    screenshot_url   TEXT,
    notes            TEXT,
    created_at       TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules(user_id);
`);

export default db;
