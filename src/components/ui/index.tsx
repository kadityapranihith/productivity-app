// Reusable UI primitives

import React from 'react'
import { cn } from '@/lib/utils'

// Card
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-[#1E2220] border border-[#262C28] rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-0', className)}>{children}</div>
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#F5F5F0]', className)}>
      {children}
    </h3>
  )
}

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'muted'
}
export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variant === 'default' && 'bg-[#252A27] text-[#8B9A8E]',
        variant === 'accent' && 'bg-[rgba(197,243,107,0.12)] text-[#C5F36B]',
        variant === 'success' && 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80]',
        variant === 'warning' && 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]',
        variant === 'muted' && 'bg-[#1E2220] text-[#5A6B5D] border border-[#262C28]',
        className
      )}
    >
      {children}
    </span>
  )
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5F36B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101211] disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-xs gap-1.5',
        size === 'md' && 'px-4 py-2 text-sm gap-2',
        size === 'lg' && 'px-6 py-2.5 text-base gap-2',
        variant === 'primary' && 'bg-[#C5F36B] text-[#101211] hover:bg-[#D4F88A] active:bg-[#9BC44E]',
        variant === 'secondary' && 'bg-[#252A27] text-[#F5F5F0] hover:bg-[#2E3530]',
        variant === 'ghost' && 'text-[#8B9A8E] hover:text-[#F5F5F0] hover:bg-[#1E2220]',
        variant === 'outline' && 'border border-[#2E3530] text-[#F5F5F0] hover:bg-[#1E2220]',
        variant === 'danger' && 'bg-[rgba(248,113,113,0.1)] text-[#F87171] hover:bg-[rgba(248,113,113,0.2)]',
        className
      )}
      {...props}
    >
      {loading ? <span className="animate-spin">⟳</span> : children}
    </button>
  )
}

// Progress bar
interface ProgressBarProps {
  value: number // 0-100
  variant?: 'accent' | 'success' | 'muted'
  size?: 'sm' | 'md'
  className?: string
  showLabel?: boolean
}
export function ProgressBar({ value, variant = 'accent', size = 'md', className, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-[#252A27] rounded-full overflow-hidden',
          size === 'sm' ? 'h-1' : 'h-1.5'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variant === 'accent' && 'bg-[#C5F36B]',
            variant === 'success' && 'bg-[#4ADE80]',
            variant === 'muted' && 'bg-[#3D4A40]',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#5A6B5D] mt-1">{Math.round(clamped)}%</span>
      )}
    </div>
  )
}

// Avatar
interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm', xl: 'w-16 h-16 text-xl' }

  return (
    <div className={cn('rounded-full overflow-hidden bg-[#2E3530] flex items-center justify-center shrink-0', sizes[size], className)}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <span className="font-semibold text-[#8B9A8E]">{initials}</span>
      }
    </div>
  )
}

// Stat card (small)
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
  className?: string
}
export function StatCard({ label, value, sub, icon, accent, className }: StatCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#5A6B5D] font-medium mb-1">{label}</p>
          <p className={cn('text-2xl font-bold tracking-tight', accent ? 'text-[#C5F36B]' : 'text-[#F5F5F0]')}>
            {value}
          </p>
          {sub && <p className="text-xs text-[#5A6B5D] mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className="text-[#5A6B5D]">{icon}</div>
        )}
      </div>
    </Card>
  )
}

// Section header
export function SectionHeader({
  title, subtitle, action, className
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h2 className="text-base font-semibold text-[#F5F5F0]">{title}</h2>
        {subtitle && <p className="text-xs text-[#5A6B5D] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// Empty state
export function EmptyState({
  icon, title, description, action
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3 opacity-40">{icon}</div>
      <h3 className="text-sm font-medium text-[#8B9A8E]">{title}</h3>
      {description && <p className="text-xs text-[#5A6B5D] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Divider
export function Divider({ className }: { className?: string }) {
  return <div className={cn('border-t border-[#262C28]', className)} />
}

// Tooltip wrapper (simple title-based)
export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#252A27] border border-[#2E3530] text-[#F5F5F0] text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {content}
      </div>
    </div>
  )
}

// Loading skeleton
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#252A27] rounded-md animate-pulse', className)} />
  )
}

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8B9A8E]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-[#181B19] border border-[#2E3530] rounded-lg text-sm text-[#F5F5F0] placeholder:text-[#3D4A40] focus:outline-none focus:border-[#C5F36B] transition-colors',
            error && 'border-[#F87171]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#F87171]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Textarea
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8B9A8E]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-[#181B19] border border-[#2E3530] rounded-lg text-sm text-[#F5F5F0] placeholder:text-[#3D4A40] focus:outline-none focus:border-[#C5F36B] transition-colors resize-y min-h-[80px]',
            error && 'border-[#F87171]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#F87171]">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// Select
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ label, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8B9A8E]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-[#181B19] border border-[#2E3530] rounded-lg text-sm text-[#F5F5F0] focus:outline-none focus:border-[#C5F36B] transition-colors appearance-none',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Logo } from './Logo'
