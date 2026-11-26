import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, Target, Calendar, Trash2, Minus, Edit3, CheckCircle2 } from 'lucide-react'
import { Card, Button, Badge, ProgressBar, SectionHeader, Input, Select, Textarea, EmptyState } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { categoryColor, cn } from '@/lib/utils'
import type { Goal, GoalCategory, GoalPeriod } from '@/types'

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

export function GoalsPage() {
  const goals = useAppStore(state => state.goals)
  const addGoal = useAppStore(state => state.addGoal)
  const updateGoal = useAppStore(state => state.updateGoal)
  const updateGoalProgress = useAppStore(state => state.updateGoalProgress)
  const deleteGoal = useAppStore(state => state.deleteGoal)

  const [showCreate, setShowCreate] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<GoalPeriod | 'all'>('all')

  const filtered = filter === 'all' ? goals : goals.filter(g => g.period === filter)
  const weekly = filtered.filter(g => g.period === 'weekly')
  const monthly = filtered.filter(g => g.period === 'monthly')
  const yearly = filtered.filter(g => g.period === 'yearly')
  const lifetime = filtered.filter(g => g.period === 'lifetime')

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Goals</h1>
            <p className="text-sm text-[#5A6B5D] mt-1">Weekly, monthly, yearly & lifetime targets.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </Button>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-[#1E2220] rounded-xl border border-[#262C28] w-fit mb-6">
        {(['all', 'weekly', 'monthly', 'yearly', 'lifetime'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
              filter === f
                ? 'bg-[#252A27] text-[#C5F36B]'
                : 'text-[#8B9A8E] hover:text-[#F5F5F0]'
            )}
          >
            {f === 'all' ? 'All' : f === 'lifetime' ? 'Lifetime' : f}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GoalForm
            mode="create"
            onSave={(goal) => {
              addGoal(goal)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        </motion.div>
      )}

      {/* Edit modal */}
      {editingGoal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GoalForm
            mode="edit"
            goal={editingGoal}
            onSave={(updates) => {
              updateGoal(editingGoal.id, updates)
              setEditingGoal(null)
            }}
            onCancel={() => setEditingGoal(null)}
          />
        </motion.div>
      )}

      {/* Goal groups */}
      <div className="space-y-8">
        {(filter === 'all' || filter === 'lifetime') && lifetime.length > 0 && (
          <GoalGroup
            title="Lifetime / Bucket List"
            goals={lifetime}
            onProgress={updateGoalProgress}
            onDelete={deleteGoal}
            onEdit={setEditingGoal}
            onToggleDone={(id, done) => updateGoal(id, { is_completed: done })}
          />
        )}
        {(filter === 'all' || filter === 'yearly') && yearly.length > 0 && (
          <GoalGroup
            title="Yearly"
            goals={yearly}
            onProgress={updateGoalProgress}
            onDelete={deleteGoal}
            onEdit={setEditingGoal}
            onToggleDone={(id, done) => updateGoal(id, { is_completed: done })}
          />
        )}
        {(filter === 'all' || filter === 'monthly') && monthly.length > 0 && (
          <GoalGroup
            title="Monthly"
            goals={monthly}
            onProgress={updateGoalProgress}
            onDelete={deleteGoal}
            onEdit={setEditingGoal}
            onToggleDone={(id, done) => updateGoal(id, { is_completed: done })}
          />
        )}
        {(filter === 'all' || filter === 'weekly') && weekly.length > 0 && (
          <GoalGroup
            title="Weekly"
            goals={weekly}
            onProgress={updateGoalProgress}
            onDelete={deleteGoal}
            onEdit={setEditingGoal}
            onToggleDone={(id, done) => updateGoal(id, { is_completed: done })}
          />
        )}
        {filtered.length === 0 && (
          <EmptyState
            icon={<Target className="w-8 h-8 text-[#5A6B5D] mx-auto" />}
            title="No goals yet"
            description="Set big-picture targets and track your progress."
            action={<Button onClick={() => setShowCreate(true)} size="sm">Create a goal</Button>}
          />
        )}
      </div>
    </div>
  )
}

function GoalGroup({
  title,
  goals,
  onProgress,
  onDelete,
  onEdit,
  onToggleDone,
}: {
  title: string
  goals: Goal[]
  onProgress: (id: string, delta: number) => void
  onDelete: (id: string) => void
  onEdit: (goal: Goal) => void
  onToggleDone: (id: string, done: boolean) => void
}) {
  return (
    <div>
      <h2 className="text-xs font-bold text-[#5A6B5D] uppercase tracking-wider mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onProgress={onProgress}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggleDone={onToggleDone}
          />
        ))}
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  onProgress,
  onDelete,
  onEdit,
  onToggleDone,
}: {
  goal: Goal
  onProgress: (id: string, delta: number) => void
  onDelete: (id: string) => void
  onEdit: (goal: Goal) => void
  onToggleDone: (id: string, done: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasTarget = goal.target_value > 0 && goal.unit && goal.unit !== '%'
  const hasNumericTarget = goal.target_value > 0
  const pct = hasNumericTarget ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0
  const color = categoryColor(goal.category)
  const isDone = goal.is_completed || (hasNumericTarget && goal.current_value >= goal.target_value)
  const descTruncated = goal.description && goal.description.length > 80

  return (
    <Card className={cn(
      'p-5 group hover:border-[#2E3530] transition-colors',
      isDone && 'border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.015)]'
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}18` }}
          >
            {isDone
              ? <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
              : <Target className="w-4 h-4" style={{ color }} />
            }
          </div>
          <div className="min-w-0">
            <h3 className={cn(
              'text-sm font-bold truncate',
              isDone ? 'text-[#8B9A8E] line-through' : 'text-[#F5F5F0]'
            )}>{goal.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="muted" className="capitalize text-[10px]">{goal.period}</Badge>
              <Badge variant="muted" className="capitalize text-[10px]">{goal.category}</Badge>
              {isDone && <Badge variant="success" className="text-[9px]">Done ✓</Badge>}
              {goal.is_shared && !isDone && <Badge variant="accent" className="text-[9px]">Shared</Badge>}
            </div>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => onToggleDone(goal.id, !isDone)}
            title={isDone ? 'Mark as incomplete' : 'Mark as done'}
            className="p-1 rounded text-[#5A6B5D] hover:text-[#4ADE80] transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(goal)}
            title="Edit goal"
            className="p-1 rounded text-[#5A6B5D] hover:text-[#C5F36B] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            title="Delete goal"
            className="p-1 hover:bg-[rgba(248,113,113,0.1)] rounded text-[#5A6B5D] hover:text-[#F87171] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {goal.description && (
        <div className="mb-3">
          <p className={cn('text-xs text-[#8B9A8E]', !expanded && descTruncated && 'line-clamp-2')}>
            {goal.description}
          </p>
          {descTruncated && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-[#5A6B5D] hover:text-[#C5F36B] mt-0.5 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Progress — only shown when target was set */}
      {hasNumericTarget && !isDone && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-[#5A6B5D]">Progress</span>
            <span className="font-semibold text-[#F5F5F0]">
              {hasTarget
                ? `${goal.current_value} / ${goal.target_value} ${goal.unit} (${pct}%)`
                : `${pct}%`}
            </span>
          </div>
          <ProgressBar value={pct} variant="accent" />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#1A1D1B]">
        {/* +/- progress controls — hidden when no numeric target or done */}
        {hasNumericTarget && !isDone ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onProgress(goal.id, -1)}
              disabled={goal.current_value <= 0}
              className="w-6 h-6 rounded-md bg-[#181B19] hover:bg-[#252A27] border border-[#262C28] text-[#8B9A8E] hover:text-[#F5F5F0] flex items-center justify-center text-xs disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onProgress(goal.id, 1)}
              className="w-6 h-6 rounded-md bg-[#181B19] hover:bg-[#252A27] border border-[#262C28] text-[#8B9A8E] hover:text-[#C5F36B] flex items-center justify-center text-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span />
        )}

        {goal.deadline && (
          <div className="flex items-center gap-1 text-[#5A6B5D] text-xs">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

type GoalFormData = Omit<Goal, 'id' | 'user_id' | 'current_value' | 'is_completed' | 'created_at' | 'updated_at'>

function GoalForm({
  mode,
  goal,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit'
  goal?: Goal
  onSave: (data: GoalFormData) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [category, setCategory] = useState<GoalCategory>(goal?.category || 'coding')
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period || 'monthly')
  const [target, setTarget] = useState(goal && goal.target_value > 0 && goal.unit !== '%' ? String(goal.target_value) : '')
  const [unit, setUnit] = useState(goal?.unit !== '%' ? (goal?.unit || '') : '')
  const [deadline, setDeadline] = useState(goal?.deadline || '')
  const [isShared, setIsShared] = useState(goal?.is_shared || false)

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '')
      setDescription(goal.description || '')
      setCategory(goal.category || 'coding')
      setPeriod(goal.period || 'monthly')
      setTarget(goal.target_value > 0 && goal.unit !== '%' ? String(goal.target_value) : '')
      setUnit(goal.unit !== '%' ? (goal.unit || '') : '')
      setDeadline(goal.deadline || '')
      setIsShared(goal.is_shared || false)
    }
  }, [goal])

  const handleSave = () => {
    if (!title.trim()) return
    const targetVal = target ? Number(target) : 0
    const unitVal = unit.trim() || (targetVal > 0 ? 'units' : '%')
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      period,
      target_value: targetVal || 100,
      unit: unitVal,
      deadline: deadline || undefined,
      is_shared: isShared,
    })
  }

  return (
    <Card className="p-5 bg-[#181B19] border-[#2E3530]">
      <h3 className="text-sm font-bold text-[#F5F5F0] mb-3">
        {mode === 'edit' ? 'Edit Goal' : 'New Goal'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Title"
          placeholder="e.g. Read 24 Books"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <Select
            label="Category"
            value={category}
            onChange={e => setCategory(e.target.value as GoalCategory)}
            className="flex-1"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select
            label="Horizon"
            value={period}
            onChange={e => setPeriod(e.target.value as GoalPeriod)}
            className="flex-1"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            label="Target (optional)"
            type="number"
            placeholder="e.g. 24"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="flex-1"
          />
          <Input
            label="Unit (optional)"
            placeholder="books / km / hrs"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="flex-1"
            disabled={!target}
          />
        </div>

        <Input
          label="Deadline (optional)"
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />

        <div className="sm:col-span-2">
          <Textarea
            label="Notes (optional)"
            placeholder="Why is this goal meaningful?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="share-goal-toggle"
            checked={isShared}
            onChange={e => setIsShared(e.target.checked)}
            className="w-4 h-4 accent-[#C5F36B]"
          />
          <label htmlFor="share-goal-toggle" className="text-xs text-[#8B9A8E]">
            Share progress with circle members
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-[#262C28]">
        <Button onClick={handleSave} disabled={!title.trim()} size="sm">
          {mode === 'edit' ? 'Save Changes' : 'Create Goal'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
