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
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

type TaskContextValue = {
  tasks: Task[]
  loading: boolean
  addTask: (title: string, priority?: TaskPriority, notes?: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
  stats: { total: number; done: number; open: number }
}

const TaskContext = createContext<TaskContextValue | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setTasks([])
        return
      }
      setLoading(true)
      try {
        const { tasks: next } = await api.listTasks()
        if (!cancelled) setTasks(next)
      } catch {
        if (!cancelled) setTasks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const addTask = useCallback(async (title: string, priority: TaskPriority = 'medium', notes?: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const { task } = await api.createTask(trimmed, priority, notes)
    setTasks((prev) => [task, ...prev])
  }, [])

  const toggleTask = useCallback(async (id: string) => {
    const current = tasks.find((t) => t.id === id)
    if (!current) return
    const { task } = await api.updateTask(id, { completed: !current.completed })
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
  }, [tasks])

  const deleteTask = useCallback(async (id: string) => {
    await api.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearCompleted = useCallback(async () => {
    await api.clearCompleted()
    setTasks((prev) => prev.filter((t) => !t.completed))
  }, [])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.completed).length
    return { total, done, open: total - done }
  }, [tasks])

  const value = useMemo(
    () => ({ tasks, loading, addTask, toggleTask, deleteTask, clearCompleted, stats }),
    [tasks, loading, addTask, toggleTask, deleteTask, clearCompleted, stats],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
