import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, parseISO } from 'date-fns'
import type { GoalCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  return format(d, 'MMM d')
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getMotivationalQuote(): string {
  const quotes = [
    'Small progress every day adds up.',
    'Consistency is the foundation of mastery.',
    'Show up. Even on the hard days.',
    'Growth is not an event. It is a practice.',
    'The goal is progress, not perfection.',
    'Every expert was once a beginner.',
    'Discipline is choosing between what you want now and what you want most.',
    'You don\'t have to be great to get started, but you have to get started to be great.',
  ]
  return quotes[new Date().getDay() % quotes.length]
}

export function categoryLabel(category: GoalCategory): string {
  const labels: Record<GoalCategory, string> = {
    education: 'Education',
    coding: 'Coding',
    fitness: 'Fitness',
    health: 'Health',
    reading: 'Reading',
    career: 'Career',
    projects: 'Projects',
    custom: 'Custom',
  }
  return labels[category] ?? category
}

export function categoryColor(category: GoalCategory): string {
  const colors: Record<GoalCategory, string> = {
    education: '#60A5FA',
    coding: '#A78BFA',
    fitness: '#34D399',
    health: '#6EE7B7',
    reading: '#FCD34D',
    career: '#FB923C',
    projects: '#F472B6',
    custom: '#94A3B8',
  }
  return colors[category] ?? '#94A3B8'
}

export function categoryEmoji(category: GoalCategory): string {
  const emojis: Record<GoalCategory, string> = {
    education: '📚',
    coding: '💻',
    fitness: '💪',
    health: '🧘',
    reading: '📖',
    career: '🚀',
    projects: '⚡',
    custom: '✨',
  }
  return emojis[category] ?? '✨'
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getYearDates(year: number): Date[] {
  const dates: Date[] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}
