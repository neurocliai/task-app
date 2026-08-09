const TOKEN_KEY = 'lumen.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

type ApiError = { error?: string }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })
  const data = (await res.json().catch(() => ({}))) as T & ApiError

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  signup(name: string, email: string, password: string) {
    return request<{ token: string; user: import('../types').User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },
  login(email: string, password: string) {
    return request<{ token: string; user: import('../types').User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me() {
    return request<{ user: import('../types').User }>('/api/auth/me')
  },
  logout() {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  },
  updateProfile(patch: Partial<Pick<import('../types').User, 'name' | 'email' | 'avatarHue'>>) {
    return request<{ user: import('../types').User }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },
  listTasks() {
    return request<{ tasks: import('../types').Task[] }>('/api/tasks')
  },
  createTask(title: string, priority?: import('../types').TaskPriority, notes?: string) {
    return request<{ task: import('../types').Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, priority, notes }),
    })
  },
  updateTask(
    id: string,
    patch: Partial<Pick<import('../types').Task, 'title' | 'notes' | 'completed' | 'priority'>>,
  ) {
    return request<{ task: import('../types').Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },
  deleteTask(id: string) {
    return request<{ ok: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' })
  },
  clearCompleted() {
    return request<{ ok: boolean }>('/api/tasks?completed=1', { method: 'DELETE' })
  },
}
