import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, CheckCircle2, Lock, Calendar, Star, Sparkles } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'

export function BadgeDetailModal() {
  const inspectingBadge = useAppStore(state => state.inspectingBadge)
  const setInspectingBadge = useAppStore(state => state.setInspectingBadge)
  const userAchievements = useAppStore(state => state.userAchievements)
  const stats = useAppStore(state => state.stats)
  const heatmapData = useAppStore(state => state.heatmapData)

  if (!inspectingBadge) return null

  const activeDaysThisYear = stats.active_days_this_year
  const allTimeDays = stats.all_time_active_days ?? heatmapData.filter(d => d.qualifies_for_consistency).length

  const userAch = userAchievements.find(ua => ua.achievement_id === inspectingBadge.id)
  const isEarned = Boolean(userAch)

  const relevantDays = inspectingBadge.type === 'all_time_worked' ? allTimeDays : activeDaysThisYear
  let progress = 0
  if (inspectingBadge.threshold) {
    progress = Math.min(100, Math.round((relevantDays / inspectingBadge.threshold) * 100))
  } else if (isEarned) {
    progress = 100
  }

  const isFullYear = inspectingBadge.type === 'complete_year_goat' || inspectingBadge.type === 'full_year_consistency'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setInspectingBadge(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#181B19] border border-[#262C28] rounded-2xl shadow-2xl p-6 md:p-8 text-center z-10 overflow-hidden"
        >
          {/* Subtle glow effect for prestigious or earned badges */}
          {isEarned && (
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C5F36B]/10 rounded-full blur-3xl pointer-events-none" />
          )}

          <button
            onClick={() => setInspectingBadge(null)}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#F5F5F0] hover:bg-[#252A27] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge Icon Showcase with subtle float animation */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className={`w-24 h-24 mx-auto mb-5 rounded-2xl flex items-center justify-center text-5xl border shadow-inner ${
              isEarned
                ? 'bg-[rgba(197,243,107,0.08)] border-[rgba(197,243,107,0.3)] shadow-[rgba(197,243,107,0.2)_0px_0px_20px]'
                : 'bg-[#1E2220] border-[#262C28] opacity-60 grayscale'
            }`}
          >
            {inspectingBadge.icon}
          </motion.div>

          <h3 className="text-xl font-bold text-[#F5F5F0] mb-1">
            {inspectingBadge.name}
          </h3>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant={isEarned ? 'accent' : 'muted'} className="text-[10px] font-semibold uppercase tracking-wider">
              {isEarned ? 'Unlocked' : 'Locked'}
            </Badge>
            {isFullYear && (
              <Badge variant="warning" className="text-[10px] font-semibold uppercase tracking-wider">
                Prestige
              </Badge>
            )}
          </div>

          <p className="text-sm text-[#8B9A8E] leading-relaxed mb-6">
            {inspectingBadge.description}
          </p>

          {/* Achievement Details */}
          <div className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl text-left space-y-2.5 mb-6 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#5A6B5D]">Category</span>
              <span className="text-[#F5F5F0] font-medium capitalize">
                {inspectingBadge.type.replace(/_/g, ' ')}
              </span>
            </div>

            {inspectingBadge.threshold && (
              <div className="flex justify-between items-center">
                <span className="text-[#5A6B5D]">Requirement</span>
                <span className="text-[#F5F5F0] font-medium">
                  {inspectingBadge.threshold} qualifying active days
                </span>
              </div>
            )}

            {isEarned && userAch?.earned_at && (
              <div className="flex justify-between items-center">
                <span className="text-[#5A6B5D]">Earned on</span>
                <span className="text-[#C5F36B] font-semibold">
                  {format(new Date(userAch.earned_at), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            {!isEarned && inspectingBadge.threshold && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#5A6B5D]">Current Progress</span>
                  <span className="text-[#F5F5F0] font-semibold">
                    {relevantDays} / {inspectingBadge.threshold} days ({progress}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#252A27] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C5F36B] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            variant={isEarned ? 'primary' : 'outline'}
            size="md"
            className="w-full"
            onClick={() => setInspectingBadge(null)}
          >
            {isEarned ? 'Celebrated' : 'Keep Working'}
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
