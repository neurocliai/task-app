import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Task, TaskPriority } from '../types'
import { loadTasks, saveTasks, uid } from '../lib/storage'
import { useAuth } from './AuthContext'

type TaskContextValue = {
  tasks: Task[]
  addTask: (title: string, priority?: TaskPriority, notes?: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  clearCompleted: () => void
  stats: { total: number; done: number; open: number }
}

const TaskContext = createContext<TaskContextValue | null>(null)

const seedTitles = [
  'Review morning plan',
  'Send project update',
  'Stretch for 10 minutes',
]

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!user) {
      setTasks([])
      return
    }
    const existing = loadTasks(user.id)
    if (existing.length === 0) {
      const seeded: Task[] = seedTitles.map((title, i) => ({
        id: uid(),
        title,
        completed: i === 0,
        priority: (['high', 'medium', 'low'] as TaskPriority[])[i],
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
        completedAt: i === 0 ? new Date().toISOString() : undefined,
      }))
      saveTasks(user.id, seeded)
      setTasks(seeded)
    } else {
      setTasks(existing)
    }
  }, [user])

  const persist = useCallback(
    (next: Task[]) => {
      if (!user) return
      setTasks(next)
      saveTasks(user.id, next)
    },
    [user],
  )

  const addTask = useCallback(
    (title: string, priority: TaskPriority = 'medium', notes?: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const task: Task = {
        id: uid(),
        title: trimmed,
        notes: notes?.trim() || undefined,
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
      }
      persist([task, ...tasks])
    },
    [persist, tasks],
  )

  const toggleTask = useCallback(
    (id: string) => {
      persist(
        tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : undefined,
              }
            : t,
        ),
      )
    },
    [persist, tasks],
  )

  const deleteTask = useCallback(
    (id: string) => {
      persist(tasks.filter((t) => t.id !== id))
    },
    [persist, tasks],
  )

  const clearCompleted = useCallback(() => {
    persist(tasks.filter((t) => !t.completed))
  }, [persist, tasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.completed).length
    return { total, done, open: total - done }
  }, [tasks])

  const value = useMemo(
    () => ({ tasks, addTask, toggleTask, deleteTask, clearCompleted, stats }),
    [tasks, addTask, toggleTask, deleteTask, clearCompleted, stats],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
