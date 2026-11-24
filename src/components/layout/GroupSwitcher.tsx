import React, { useState } from 'react'
import { Users, ChevronDown, Check, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function GroupSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const groups = useAppStore(state => state.groups)
  const activeGroupId = useAppStore(state => state.activeGroupId)
  const setActiveGroup = useAppStore(state => state.setActiveGroup)

  const activeGroup = groups.find(g => g.id === activeGroupId) ?? groups[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#1E2220] hover:bg-[#252A27] border border-[#262C28] rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-[#C5F36B]/10 text-[#C5F36B] flex items-center justify-center text-xs font-bold shrink-0">
            {activeGroup?.name?.[0] ?? 'G'}
          </div>
          <span className="text-xs font-medium text-[#F5F5F0] truncate">
            {activeGroup?.name ?? 'Select Group'}
          </span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#5A6B5D] transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#181B19] border border-[#2E3530] rounded-xl shadow-xl py-1 z-50 divide-y divide-[#262C28]">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#5A6B5D] uppercase tracking-wider">
              Your Accountability Groups
            </div>
            <div className="py-1">
              {groups.map(group => {
                const isSelected = group.id === activeGroupId
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveGroup(group.id)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#F5F5F0] hover:bg-[#1E2220] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Users className="w-3.5 h-3.5 text-[#8B9A8E]" />
                      <span className={cn('truncate', isSelected && 'font-semibold text-[#C5F36B]')}>
                        {group.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#C5F36B]" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
