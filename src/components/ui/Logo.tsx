import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = false, className }: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  }

  const svgSizes = {
    sm: 32,
    md: 36,
    lg: 44,
    xl: 56,
  }

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }

  const subSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Precision Vector Emblem */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 bg-gradient-to-br from-[#1E2320] to-[#101211] border border-[#2E3530] shadow-[0_0_16px_rgba(197,243,107,0.18)] transition-transform hover:scale-105',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 40 40"
          width={svgSizes[size]}
          height={svgSizes[size]}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            <linearGradient id="logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2FFA8" />
              <stop offset="60%" stopColor="#C5F36B" />
              <stop offset="100%" stopColor="#84CC16" />
            </linearGradient>
            <filter id="logo-drop" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#C5F36B" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Stepped momentum anchor mark */}
          <g filter="url(#logo-drop)">
            {/* Subtle base track */}
            <path
              d="M10 27 L18 27 C19.65 27 21 25.65 21 24 L21 19 C21 17.35 22.35 16 24 16 L29 16"
              stroke="#3A463D"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Active momentum curve */}
            <path
              d="M10 22 C12 22 15 22 16.5 22 C18.15 22 19.5 20.65 19.5 19 L19.5 15 C19.5 13.35 20.85 12 22.5 12 L30 12"
              stroke="url(#logo-glow)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Consistency pulse nodes */}
            <circle cx="10" cy="22" r="2.4" fill="#C5F36B" />
            <circle cx="30" cy="12" r="2.8" fill="#E2FFA8" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={cn('font-bold text-[#F5F5F0] tracking-tight block leading-tight', titleSizes[size])}>
            Barely Productive
          </span>
          <span className={cn('text-[#8B9A8E] block font-medium leading-tight mt-0.5', subSizes[size])}>
            Consistency over intensity
          </span>
        </div>
      )}
    </div>
  )
}
