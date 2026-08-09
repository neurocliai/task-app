export type User = {
  id: string
  name: string
  email: string
  avatarHue: number
  createdAt: string
}

export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  title: string
  notes?: string
  completed: boolean
  priority: TaskPriority
  createdAt: string
  completedAt?: string
}

export type AuthMode = 'login' | 'signup'
