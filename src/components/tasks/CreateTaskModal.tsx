import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame } from 'lucide-react'
import { Button, Input, Select, Badge } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import type { GoalCategory } from '@/types'

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'coding', label: 'Coding & Tech' },
  { value: 'education', label: 'Education & Study' },
  { value: 'fitness', label: 'Fitness & Gym' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'reading', label: 'Reading & Growth' },
  { value: 'career', label: 'Career & Business' },
  { value: 'projects', label: 'Projects & Build' },
  { value: 'custom', label: 'Custom Goal' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const addTask = useAppStore(state => state.addTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('coding')
  const [normalTarget, setNormalTarget] = useState('')
  const [minTarget, setMinTarget] = useState('')
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [countsForConsistency, setCountsForConsistency] = useState(true)

  if (!isOpen) return null

  const toggleDay = (dayIndex: number) => {
    setRecurringDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !normalTarget.trim() || !minTarget.trim()) return

    // System points: 20 pts for normal target, 10 pts for bare-minimum anchor
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      normal_target: normalTarget.trim(),
      normal_points: 20,
      min_target: minTarget.trim(),
      min_points: 10,
      is_recurring: recurringDays.length > 0,
      recurring_days: recurringDays,
      counts_for_consistency: countsForConsistency,
      is_active: true,
      sort_order: 1,
    })

    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#181B19] border border-[#262C28] rounded-2xl shadow-2xl p-6 z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#262C28] mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F0]">Create Daily Task</h2>
              <p className="text-xs text-[#5A6B5D] mt-0.5">Define your daily target and bare-minimum anchor</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#F5F5F0] hover:bg-[#252A27] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Task Title"
                  placeholder="e.g. Daily DSA Practice, Running, Book Reading"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <Select
                label="Category"
                value={category}
                onChange={e => setCategory(e.target.value as GoalCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>

            {/* Description */}
            <Input
              label="Notes (optional)"
              placeholder="e.g. Focus on medium problems or outdoor run"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            {/* Targets Section */}
            <div className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl space-y-4">
              {/* Normal Target */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F5F5F0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                    Normal Target
                  </label>
                  <Badge variant="accent">20 pts</Badge>
                </div>
                <Input
                  placeholder="e.g. Solve 3 problems, Run 5 km, Read 20 pages"
                  value={normalTarget}
                  onChange={e => setNormalTarget(e.target.value)}
                  required
                />
              </div>

              {/* Bare Minimum Target */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#F5F5F0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    Bare-Minimum Anchor
                  </label>
                  <Badge variant="warning">10 pts</Badge>
                </div>
                <Input
                  placeholder="e.g. Solve 1 problem, Run 1 km, Read 5 pages"
                  value={minTarget}
                  onChange={e => setMinTarget(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recurring Days */}
            <div>
              <label className="text-xs font-semibold text-[#8B9A8E] mb-2 block">
                Scheduled Days
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, idx) => {
                  const isSelected = recurringDays.includes(idx)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#C5F36B] border-[#C5F36B] text-[#101211]'
                          : 'bg-[#1E2220] border-[#262C28] text-[#5A6B5D] hover:text-[#8B9A8E]'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Consistency toggle */}
            <div className="flex items-center justify-between p-3 bg-[#1E2220] border border-[#262C28] rounded-xl">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <p className="text-xs font-semibold text-[#F5F5F0]">Counts towards daily consistency</p>
                  <p className="text-[10px] text-[#5A6B5D]">Must complete normal or bare-min target to advance streak</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={countsForConsistency}
                onChange={e => setCountsForConsistency(e.target.checked)}
                className="w-4 h-4 accent-[#C5F36B]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="md" className="flex-1">
                Save & Schedule Task
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
