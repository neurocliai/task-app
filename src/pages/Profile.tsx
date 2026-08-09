import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Pencil, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TaskContext'
import './Profile.css'

export function Profile() {
  const { user, updateProfile, logout } = useAuth()
  const { stats } = useTasks()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')

  if (!user) return null

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const result = await updateProfile({ name: name.trim() })
    if (result.ok) setEditing(false)
  }

  function onLogout() {
    // Leave protected routes first so clearing the session does not bounce to /auth
    navigate('/', { replace: true })
    window.setTimeout(() => logout(), 0)
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="page profile-page">
      <header className="profile-header">
        <p className="eyebrow">Profile</p>
        <h1 className="h2">Your space</h1>
      </header>

      <motion.section
        className="profile-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="avatar"
          style={{
            background: `linear-gradient(145deg, hsl(${user.avatarHue} 48% 46%), hsl(${(user.avatarHue + 40) % 360} 42% 58%))`,
          }}
        >
          {initials}
        </div>
        <div className="profile-id">
          <h2 className="profile-name">{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <button className="icon-btn" aria-label="Edit name" onClick={() => setEditing((v) => !v)}>
          <Pencil size={16} />
        </button>
      </motion.section>

      {editing && (
        <motion.form
          className="edit-form"
          onSubmit={onSave}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="field">
            <label htmlFor="edit-name">Display name</label>
            <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            Save changes
          </button>
        </motion.form>
      )}

      <section className="stats-row" aria-label="Task stats">
        <div>
          <strong>{stats.total}</strong>
          <span>Total</span>
        </div>
        <div>
          <strong>{stats.open}</strong>
          <span>Open</span>
        </div>
        <div>
          <strong>{stats.done}</strong>
          <span>Done</span>
        </div>
      </section>

      <section className="profile-list">
        <div className="profile-row">
          <Sparkles size={18} />
          <div>
            <p>Focus mode</p>
            <span>Keep the list lean — one day at a time</span>
          </div>
        </div>
        <div className="profile-row muted-row">
          <div>
            <p>Member since</p>
            <span>
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </section>

      <button className="btn btn-ghost btn-block logout-btn" onClick={onLogout}>
        <LogOut size={18} />
        Sign out
      </button>
    </main>
  )
}
