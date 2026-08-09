import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'lumen.db')

fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    avatar_hue INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`)

export function uid() {
  return randomUUID()
}

export function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarHue: row.avatar_hue,
    createdAt: row.created_at,
  }
}

export function mapTask(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || undefined,
    completed: Boolean(row.completed),
    priority: row.priority,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  }
}
