import type { Task, User } from '../types'

const USER_KEY = 'lumen.user'
const TASKS_KEY = 'lumen.tasks'
const SESSION_KEY = 'lumen.session'

export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function saveUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function loadSession(): boolean {
  return localStorage.getItem(SESSION_KEY) === '1'
}

export function saveSession(active: boolean) {
  if (active) localStorage.setItem(SESSION_KEY, '1')
  else localStorage.removeItem(SESSION_KEY)
}

export function loadTasks(userId: string): Task[] {
  try {
    const raw = localStorage.getItem(`${TASKS_KEY}.${userId}`)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}

export function saveTasks(userId: string, tasks: Task[]) {
  localStorage.setItem(`${TASKS_KEY}.${userId}`, JSON.stringify(tasks))
}

export function uid() {
  return crypto.randomUUID()
}
