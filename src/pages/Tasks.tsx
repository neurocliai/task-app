import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TaskContext'
import type { Task, TaskPriority } from '../types'
import './Tasks.css'

type Filter = 'all' | 'open' | 'done'

export function Tasks() {
  const { user } = useAuth()
  const { tasks, addTask, toggleTask, deleteTask, clearCompleted, stats } = useTasks()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const visible = useMemo(() => {
    if (filter === 'open') return tasks.filter((t) => !t.completed)
    if (filter === 'done') return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask(title, priority)
    setTitle('')
    setPriority('medium')
    setOpen(false)
  }

  return (
    <main className="page tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">{greeting}</p>
          <h1 className="h2">{user?.name?.split(' ')[0] || 'Friend'}</h1>
        </div>
        <div className="progress-ring" aria-label={`${stats.done} of ${stats.total} done`}>
          <svg viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(21,32,43,0.08)" strokeWidth="5" />
            <motion.circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#0d7a6f"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18}
              initial={false}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 18 * (1 - (stats.total ? stats.done / stats.total : 0)),
              }}
              transform="rotate(-90 24 24)"
            />
          </svg>
          <span>
            {stats.done}/{stats.total || 0}
          </span>
        </div>
      </header>

      <div className="filter-row" role="tablist" aria-label="Filter tasks">
        {(['all', 'open', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Done'}
          </button>
        ))}
        {stats.done > 0 && (
          <button className="clear-done" onClick={clearCompleted}>
            Clear done
          </button>
        )}
      </div>

      <section className="task-list" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              className="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="h2" style={{ fontSize: '1.25rem' }}>
                {filter === 'done' ? 'Nothing completed yet' : 'Your list is clear'}
              </p>
              <p className="lead">
                {filter === 'done'
                  ? 'Finish a task and it will land here.'
                  : 'Add one thing you want to move forward today.'}
              </p>
            </motion.div>
          ) : (
            visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </AnimatePresence>
      </section>

      <button className="fab" aria-label="Add task" onClick={() => setOpen(true)}>
        <Plus size={24} strokeWidth={2.4} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.form
              className="sheet"
              onClick={(e) => e.stopPropagation()}
              onSubmit={onAdd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <div className="sheet-handle" />
              <div className="sheet-head">
                <h2 className="h2" style={{ fontSize: '1.3rem' }}>
                  New task
                </h2>
                <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="field">
                <label htmlFor="task-title">What needs doing?</label>
                <input
                  id="task-title"
                  autoFocus
                  placeholder="Write a short, clear title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="priority-picker" role="group" aria-label="Priority">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`prio-btn${priority === p ? ' active' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    <span className={`priority-dot priority-${p}`} />
                    {p}
                  </button>
                ))}
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={!title.trim()}>
                Add to list
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <motion.article
      layout
      className={`task-row${task.completed ? ' done' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
    >
      <button
        className={`check${task.completed ? ' on' : ''}`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={onToggle}
      >
        {task.completed ? <Check size={16} strokeWidth={3} /> : null}
      </button>
      <div className="task-body">
        <p className="task-title">{task.title}</p>
        <div className="task-meta">
          <span className={`priority-dot priority-${task.priority}`} />
          <span>{task.priority}</span>
        </div>
      </div>
      <button className="icon-btn danger" aria-label="Delete task" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </motion.article>
  )
}
