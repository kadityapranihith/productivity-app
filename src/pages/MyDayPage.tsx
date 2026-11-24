import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Plus, CheckCircle2, Circle, Flame,
  Trash2, CheckCheck
} from 'lucide-react'
import {
  Card, Button, Badge, Input, Select,
  SectionHeader, ProgressBar, StatCard
} from '@/components/ui'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { useAppStore } from '@/lib/store'
import { categoryColor, cn, todayString } from '@/lib/utils'
import type { Task, GoalCategory, CompletionStatus } from '@/types'

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'coding', label: 'Coding' },
  { value: 'education', label: 'Education' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'health', label: 'Health' },
  { value: 'reading', label: 'Reading' },
  { value: 'career', label: 'Career' },
  { value: 'projects', label: 'Projects' },
  { value: 'custom', label: 'Custom' },
]

export function MyDayPage() {
  const today = format(new Date(), 'EEEE, MMMM d')
  const todayStr = todayString()

  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAdditionalForm, setShowAdditionalForm] = useState(false)

  const tasks = useAppStore(state => state.tasks)
  const completions = useAppStore(state => state.completions)
  const additionalTasks = useAppStore(state => state.additionalTasks)
  const stats = useAppStore(state => state.stats)
  const completeTask = useAppStore(state => state.completeTask)
  const addAdditionalTask = useAppStore(state => state.addAdditionalTask)
  const toggleAdditionalTask = useAppStore(state => state.toggleAdditionalTask)
  const deleteAdditionalTask = useAppStore(state => state.deleteAdditionalTask)
  const deleteTask = useAppStore(state => state.deleteTask)

  const todayDayOfWeek = new Date().getDay()
  const todayTasks = tasks.filter(t =>
    t.is_active && (
      (t.is_recurring && t.recurring_days.includes(todayDayOfWeek)) ||
      (!t.is_recurring && t.scheduled_date === todayStr)
    )
  )

  const todayCompletions = completions.filter(c => c.date === todayStr)
  const completionMap = Object.fromEntries(todayCompletions.map(c => [c.task_id, c.status as CompletionStatus]))

  const totalTasks = todayTasks.length
  const normalCount = Object.values(completionMap).filter(s => s === 'normal').length
  const bareCount = Object.values(completionMap).filter(s => s === 'bare_minimum').length
  const completedCount = normalCount + bareCount
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#5A6B5D] font-medium mb-1 tracking-wide uppercase">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">My Day</h1>
          </div>
          <Button
            onClick={() => setShowAddTaskModal(true)}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </motion.div>

      {/* Daily Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        <StatCard label="Progress" value={`${progress}%`} sub={`${completedCount}/${totalTasks} done`} accent />
        <StatCard label="Points Today" value={stats.points_today} sub="earned" />
        <StatCard label="Full Targets" value={normalCount} sub="completed" />
        <StatCard label="Bare-Minimum" value={bareCount} sub="anchored" />
      </motion.div>

      {/* Daily Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5F5F0]">Daily Target</span>
            {progress >= 100 ? (
              <Badge variant="success">Done ✓</Badge>
            ) : bareCount > 0 ? (
              <Badge variant="warning">Anchored</Badge>
            ) : (
              <Badge variant="muted">In Progress</Badge>
            )}
          </div>
          <span className="text-xs font-bold text-[#C5F36B]">{completedCount}/{totalTasks}</span>
        </div>
        <ProgressBar value={progress} size="md" variant={progress >= 100 ? 'success' : 'accent'} />
      </motion.div>

      {/* Task List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 mb-6"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[#5A6B5D] uppercase tracking-wider">
            Scheduled ({todayTasks.length})
          </h2>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#1E2220] border border-[#262C28] rounded-xl">
            <p className="text-sm text-[#8B9A8E]">No tasks scheduled for today.</p>
            <Button
              onClick={() => setShowAddTaskModal(true)}
              size="sm"
              className="mt-3 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          </div>
        ) : (
          todayTasks.map((task) => (
            <TaskCardItem
              key={task.id}
              task={task}
              status={completionMap[task.id] ?? 'none'}
              onMark={(level) => completeTask(task.id, level)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </motion.div>

      {/* Additional Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-1 mb-3">
          <h2 className="text-xs font-semibold text-[#5A6B5D] uppercase tracking-wider">
            Bonus Tasks ({additionalTasks.length})
          </h2>
          <span className="text-xs text-[#5A6B5D]">+5 pts each</span>
        </div>

        {additionalTasks.length > 0 && (
          <div className="space-y-2 mb-3">
            {additionalTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-[#1E2220] border border-[#262C28] rounded-xl"
              >
                <button
                  onClick={() => toggleAdditionalTask(task.id)}
                  className="transition-transform active:scale-95"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#2E3530] hover:text-[#5A6B5D]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm font-medium',
                    task.completed ? 'line-through text-[#5A6B5D]' : 'text-[#F5F5F0]'
                  )}>
                    {task.title}
                  </span>
                  <span className="text-[10px] text-[#5A6B5D] ml-2 capitalize">
                    {task.category}
                  </span>
                </div>
                <Badge variant="accent">+5</Badge>
                <button
                  onClick={() => deleteAdditionalTask(task.id)}
                  className="p-1 text-[#5A6B5D] hover:text-[#F87171] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showAdditionalForm ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AddAdditionalTaskForm
                onAdd={(t) => {
                  addAdditionalTask(t.title, t.category, 5)
                  setShowAdditionalForm(false)
                }}
                onCancel={() => setShowAdditionalForm(false)}
              />
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAdditionalForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#8B9A8E] hover:text-[#F5F5F0] border border-dashed border-[#262C28] hover:border-[#2E3530] rounded-xl transition-all"
            >
              <Plus className="w-4 h-4 text-[#C5F36B]" />
              Add Bonus Task
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* Streak protection note */}
      <div className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl flex items-center gap-3">
        <Flame className="w-4 h-4 text-[#F59E0B] shrink-0" />
        <p className="text-xs text-[#5A6B5D]">
          Bare-minimum or full target on any scheduled day counts for your streak. Rest days never break it.
        </p>
      </div>

      <CreateTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
      />
    </div>
  )
}

function TaskCardItem({
  task,
  status,
  onMark,
  onDelete
}: {
  task: Task
  status: CompletionStatus
  onMark: (level: CompletionStatus) => void
  onDelete: () => void
}) {
  const color = categoryColor(task.category)
  const isNormal = status === 'normal'
  const isBare = status === 'bare_minimum'

  return (
    <div className={cn(
      'bg-[#1E2220] border rounded-xl overflow-hidden transition-all',
      isNormal
        ? 'border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.02)]'
        : isBare
          ? 'border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.02)]'
          : 'border-[#262C28]'
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <h3 className="text-sm font-semibold text-[#F5F5F0]">{task.title}</h3>
            {task.counts_for_consistency && (
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" aria-label="Counts towards streak" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {isNormal && <Badge variant="success">Done ✓</Badge>}
            {isBare && <Badge variant="warning">Bare-min</Badge>}
            <button
              onClick={onDelete}
              className="p-1 text-[#5A6B5D] hover:text-[#F87171] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-[#5A6B5D] mb-3">{task.description}</p>
        )}

        {/* Dual Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-[#181B19] border border-[#262C28] rounded-lg">
            <span className="text-[10px] text-[#5A6B5D] uppercase font-bold tracking-wider block">Target</span>
            <span className="font-semibold text-[#F5F5F0] mt-0.5 block">{task.normal_target}</span>
          </div>
          <div className="p-2.5 bg-[#181B19] border border-[#262C28] rounded-lg">
            <span className="text-[10px] text-[#5A6B5D] uppercase font-bold tracking-wider block">Bare-min</span>
            <span className="font-semibold text-[#8B9A8E] mt-0.5 block">{task.min_target}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex border-t border-[#1A1D1B] divide-x divide-[#1A1D1B] bg-[#181B19]/40 text-xs font-semibold">
        {!isNormal && (
          <>
            <button
              onClick={() => onMark(isBare ? 'none' : 'bare_minimum')}
              className={cn(
                'flex-1 py-2.5 transition-colors',
                isBare
                  ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                  : 'text-[#8B9A8E] hover:text-[#F59E0B] hover:bg-[#1E2220]'
              )}
            >
              {isBare ? 'Anchored' : 'Bare-min'}
            </button>
            <button
              onClick={() => onMark('normal')}
              className="flex-1 py-2.5 text-[#8B9A8E] hover:text-[#C5F36B] hover:bg-[rgba(197,243,107,0.06)] transition-colors"
            >
              {isBare ? 'Complete' : 'Complete'}
            </button>
          </>
        )}

        {isNormal && (
          <button
            onClick={() => onMark('none')}
            className="w-full py-2.5 text-[#5A6B5D] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.05)] transition-colors"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}

function AddAdditionalTaskForm({
  onAdd,
  onCancel
}: {
  onAdd: (task: { title: string; category: GoalCategory; points: number }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('custom')

  return (
    <Card className="p-4 bg-[#181B19] border-[#2E3530]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#F5F5F0]">Bonus Task</p>
        <Badge variant="accent">+5 pts</Badge>
      </div>
      <div className="space-y-3">
        <Input
          placeholder="Task title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Select
            value={category}
            onChange={e => setCategory(e.target.value as GoalCategory)}
            className="flex-1"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (title.trim()) onAdd({ title: title.trim(), category, points: 5 })
            }}
            disabled={!title.trim()}
            size="sm"
            className="flex-1"
          >
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
