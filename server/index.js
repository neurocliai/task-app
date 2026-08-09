import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { db, mapTask, mapUser, uid } from './db.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const SESSION_DAYS = 30

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

function getToken(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return null
}

function requireAuth(req, res, next) {
  const token = getToken(req)
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' })
    return
  }

  const session = db
    .prepare(
      `SELECT s.token, s.user_id, s.expires_at, u.id, u.name, u.email, u.avatar_hue, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token)

  if (!session) {
    res.status(401).json({ error: 'Session expired. Sign in again.' })
    return
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    res.status(401).json({ error: 'Session expired. Sign in again.' })
    return
  }

  req.user = mapUser(session)
  req.token = token
  next()
}

function createSession(userId) {
  const token = uid()
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  ).run(token, userId, createdAt, expiresAt)
  return token
}

function seedTasksForUser(userId) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c
  if (count > 0) return

  const seeds = [
    { title: 'Review morning plan', priority: 'high', completed: 1 },
    { title: 'Send project update', priority: 'medium', completed: 0 },
    { title: 'Stretch for 10 minutes', priority: 'low', completed: 0 },
  ]

  const insert = db.prepare(
    `INSERT INTO tasks (id, user_id, title, notes, completed, priority, created_at, completed_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
  )

  const now = Date.now()
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    const createdAt = new Date(now - i * 3600_000).toISOString()
    insert.run(
      uid(),
      userId,
      s.title,
      s.completed,
      s.priority,
      createdAt,
      s.completed ? new Date().toISOString() : null,
    )
  }
}

function hashHue(email) {
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 360
  return h
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'sqlite' })
})

app.post('/api/auth/signup', (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!name) return res.status(400).json({ error: 'What should we call you?' })
  if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email.' })
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' })

  const id = uid()
  const createdAt = new Date().toISOString()
  const passwordHash = bcrypt.hashSync(password, 10)
  const avatarHue = hashHue(email)

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, avatar_hue, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, name, email, passwordHash, avatarHue, createdAt)

  seedTasksForUser(id)
  const token = createSession(id)
  const user = mapUser(
    db.prepare('SELECT id, name, email, avatar_hue, created_at FROM users WHERE id = ?').get(id),
  )

  res.status(201).json({ token, user })
})

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter email and password.' })
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  seedTasksForUser(row.id)
  const token = createSession(row.id)
  res.json({ token, user: mapUser(row) })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token)
  res.json({ ok: true })
})

app.patch('/api/profile', requireAuth, (req, res) => {
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined
  const email =
    req.body?.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined
  const avatarHue =
    req.body?.avatarHue !== undefined ? Number(req.body.avatarHue) : undefined

  if (name !== undefined && !name) {
    return res.status(400).json({ error: 'Name cannot be empty.' })
  }
  if (email !== undefined && !email.includes('@')) {
    return res.status(400).json({ error: 'Enter a valid email.' })
  }
  if (email) {
    const clash = db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email, req.user.id)
    if (clash) return res.status(409).json({ error: 'That email is already in use.' })
  }

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const nextName = name ?? current.name
  const nextEmail = email ?? current.email
  const nextHue = Number.isFinite(avatarHue) ? avatarHue : current.avatar_hue

  db.prepare('UPDATE users SET name = ?, email = ?, avatar_hue = ? WHERE id = ?').run(
    nextName,
    nextEmail,
    nextHue,
    req.user.id,
  )

  const user = mapUser(
    db
      .prepare('SELECT id, name, email, avatar_hue, created_at FROM users WHERE id = ?')
      .get(req.user.id),
  )
  res.json({ user })
})

app.get('/api/tasks', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM tasks WHERE user_id = ?
       ORDER BY completed ASC, created_at DESC`,
    )
    .all(req.user.id)
  res.json({ tasks: rows.map(mapTask) })
})

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = String(req.body?.title ?? '').trim()
  const notes = req.body?.notes ? String(req.body.notes).trim() : null
  const priority = ['low', 'medium', 'high'].includes(req.body?.priority)
    ? req.body.priority
    : 'medium'

  if (!title) return res.status(400).json({ error: 'Task title is required.' })

  const id = uid()
  const createdAt = new Date().toISOString()
  db.prepare(
    `INSERT INTO tasks (id, user_id, title, notes, completed, priority, created_at, completed_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`,
  ).run(id, req.user.id, title, notes, priority, createdAt)

  const task = mapTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
  res.status(201).json({ task })
})

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Task not found.' })

  let completed = row.completed
  let completedAt = row.completed_at
  let title = row.title
  let notes = row.notes
  let priority = row.priority

  if (typeof req.body?.completed === 'boolean') {
    completed = req.body.completed ? 1 : 0
    completedAt = req.body.completed ? new Date().toISOString() : null
  }
  if (req.body?.title !== undefined) {
    title = String(req.body.title).trim()
    if (!title) return res.status(400).json({ error: 'Task title is required.' })
  }
  if (req.body?.notes !== undefined) {
    notes = req.body.notes ? String(req.body.notes).trim() : null
  }
  if (req.body?.priority !== undefined) {
    if (!['low', 'medium', 'high'].includes(req.body.priority)) {
      return res.status(400).json({ error: 'Invalid priority.' })
    }
    priority = req.body.priority
  }

  db.prepare(
    `UPDATE tasks SET title = ?, notes = ?, completed = ?, priority = ?, completed_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(title, notes, completed, priority, completedAt, row.id, req.user.id)

  const task = mapTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id))
  res.json({ task })
})

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found.' })
  res.json({ ok: true })
})

app.delete('/api/tasks', requireAuth, (req, res) => {
  if (req.query.completed !== '1') {
    return res.status(400).json({ error: 'Pass ?completed=1 to clear completed tasks.' })
  }
  db.prepare('DELETE FROM tasks WHERE user_id = ? AND completed = 1').run(req.user.id)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Lumen API listening on http://localhost:${PORT}`)
})
