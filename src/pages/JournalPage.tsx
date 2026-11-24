import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, isToday } from 'date-fns'
import { Plus, Edit3, Trash2, Search, ChevronLeft, ChevronRight, Save, ShieldAlert } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import type { JournalEntry } from '@/types'

const PROMPTS = [
  'What did I accomplish?',
  'What did I learn?',
  'What went well?',
  'What difficulties did I face?',
  'What to improve?',
  'Focus for tomorrow?',
]

export function JournalPage() {
  const journalEntries = useAppStore(state => state.journalEntries)
  const addJournalEntry = useAppStore(state => state.addJournalEntry)
  const updateJournalEntry = useAppStore(state => state.updateJournalEntry)
  const deleteJournalEntry = useAppStore(state => state.deleteJournalEntry)

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState(false)
  const [draftContent, setDraftContent] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [search, setSearch] = useState('')

  const dateEntries = journalEntries.filter(e => e.date === selectedDate)
  const filteredEntries = search
    ? journalEntries.filter(e =>
        e.content.toLowerCase().includes(search.toLowerCase()) ||
        e.title?.toLowerCase().includes(search.toLowerCase())
      )
    : journalEntries

  function saveNewEntry() {
    if (!draftContent.trim()) return
    addJournalEntry({
      date: selectedDate,
      title: draftTitle.trim() || undefined,
      content: draftContent.trim(),
    })
    setNewEntry(false)
    setDraftContent('')
    setDraftTitle('')
  }

  function saveEdit(id: string, content: string, title?: string) {
    updateJournalEntry(id, content, title)
    setEditingId(null)
  }

  function navDate(dir: -1 | 1) {
    const d = parseISO(selectedDate)
    const next = new Date(d)
    next.setDate(next.getDate() + dir)
    setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Journal</h1>
          </div>
          <div className="flex items-center gap-2 p-2 px-3 bg-[#181B19] border border-[#262C28] rounded-xl text-xs text-[#8B9A8E]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C5F36B] shrink-0" />
            <span>100% private</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Date nav + history */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navDate(-1)}
                className="p-1.5 hover:bg-[#252A27] rounded-lg text-[#8B9A8E] hover:text-[#F5F5F0] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-[#F5F5F0]">
                  {isToday(parseISO(selectedDate)) ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-[#5A6B5D]">
                  {format(parseISO(selectedDate), 'EEEE')}
                </p>
              </div>
              <button
                onClick={() => navDate(1)}
                disabled={isToday(parseISO(selectedDate))}
                className="p-1.5 hover:bg-[#252A27] rounded-lg text-[#8B9A8E] hover:text-[#F5F5F0] transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6B5D]" />
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1E2220] border border-[#262C28] rounded-xl text-xs text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none focus:border-[#C5F36B]"
            />
          </div>

          {/* History */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#5A6B5D] uppercase tracking-wider px-1">
              History ({filteredEntries.length})
            </p>
            {filteredEntries.slice(0, 15).map(entry => (
              <button
                key={entry.id}
                onClick={() => setSelectedDate(entry.date)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  entry.date === selectedDate
                    ? 'bg-[rgba(197,243,107,0.06)] border-[rgba(197,243,107,0.25)]'
                    : 'bg-[#1E2220] border-[#262C28] hover:border-[#2E3530]'
                }`}
              >
                <p className="text-xs font-semibold text-[#F5F5F0] truncate">
                  {entry.title || format(parseISO(entry.date), 'EEEE, MMM d')}
                </p>
                <p className="text-[11px] text-[#5A6B5D] mt-0.5 line-clamp-2">
                  {entry.content.replace(/#+\s/g, '').slice(0, 80)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Writing area */}
        <div className="md:col-span-2 space-y-4">
          {!newEntry && (
            <Button onClick={() => setNewEntry(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Write for {isToday(parseISO(selectedDate)) ? 'Today' : format(parseISO(selectedDate), 'MMM d')}
            </Button>
          )}

          {newEntry && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5 md:p-6 bg-[#181B19] border-[#2E3530]">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none border-b border-[#262C28] pb-2 mb-4"
                  />

                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-[#5A6B5D] uppercase tracking-wider mb-2">Prompts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PROMPTS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDraftContent(prev => prev + (prev ? '\n\n' : '') + `## ${p}\n\n`)}
                          className="px-2.5 py-1 text-[11px] bg-[#252A27] text-[#8B9A8E] hover:text-[#C5F36B] hover:bg-[#2E3530] rounded-lg transition-colors border border-[#2E3530]"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="Write your reflection... (Markdown supported)"
                    value={draftContent}
                    onChange={e => setDraftContent(e.target.value)}
                    rows={12}
                    className="w-full bg-transparent text-sm text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none resize-none font-mono leading-relaxed"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 border-t border-[#262C28] pt-4">
                  <Button onClick={saveNewEntry} disabled={!draftContent.trim()} size="sm" className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewEntry(false)
                      setDraftContent('')
                      setDraftTitle('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {dateEntries.length === 0 && !newEntry ? (
            <div className="p-12 text-center bg-[#1E2220] border border-[#262C28] rounded-xl">
              <p className="text-sm text-[#5A6B5D]">No entries for {format(parseISO(selectedDate), 'MMM d')}</p>
              <Button onClick={() => setNewEntry(true)} size="sm" className="mt-4">
                Write an entry
              </Button>
            </div>
          ) : (
            dateEntries.map(entry => (
              <JournalCard
                key={entry.id}
                entry={entry}
                isEditing={editingId === entry.id}
                onEdit={() => setEditingId(entry.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={(c, t) => saveEdit(entry.id, c, t)}
                onDelete={() => deleteJournalEntry(entry.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function JournalCard({
  entry,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete
}: {
  entry: JournalEntry
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (content: string, title?: string) => void
  onDelete: () => void
}) {
  const [content, setContent] = useState(entry.content)
  const [title, setTitle] = useState(entry.title ?? '')

  if (isEditing) {
    return (
      <Card className="p-5 bg-[#181B19] border-[#2E3530]">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full bg-transparent text-base font-bold text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none border-b border-[#262C28] pb-2 mb-3"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={10}
          className="w-full bg-transparent text-sm text-[#F5F5F0] focus:outline-none resize-none font-mono leading-relaxed"
          autoFocus
        />
        <div className="flex gap-2 border-t border-[#262C28] pt-3 mt-3">
          <Button onClick={() => onSave(content, title || undefined)} size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      </Card>
    )
  }

  const lines = entry.content.split('\n')

  return (
    <Card className="p-6 group hover:border-[#2E3530] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          {entry.title ? (
            <h3 className="text-base font-bold text-[#F5F5F0]">{entry.title}</h3>
          ) : (
            <h3 className="text-base font-bold text-[#F5F5F0]">
              {format(parseISO(entry.date), 'EEEE, MMMM d')}
            </h3>
          )}
          <p className="text-xs text-[#5A6B5D] mt-0.5">
            {format(new Date(entry.created_at), 'h:mm a')}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-[#252A27] rounded-lg text-[#8B9A8E] hover:text-[#F5F5F0] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-[rgba(248,113,113,0.1)] rounded-lg text-[#5A6B5D] hover:text-[#F87171] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('## ')) {
            return (
              <h4 key={idx} className="text-xs font-bold text-[#C5F36B] uppercase tracking-wide mt-4 mb-1 first:mt-0">
                {line.replace('## ', '')}
              </h4>
            )
          }
          if (line.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-sm font-bold text-[#F5F5F0] mt-4 mb-1 first:mt-0">
                {line.replace('# ', '')}
              </h3>
            )
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />
          }
          return (
            <p key={idx} className="text-[#8B9A8E] leading-relaxed">
              {line}
            </p>
          )
        })}
      </div>
    </Card>
  )
}
