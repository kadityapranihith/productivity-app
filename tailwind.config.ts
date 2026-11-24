import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: '#101211',
        'background-secondary': '#181B19',
        'background-card': '#1E2220',
        'background-elevated': '#252A27',
        'primary-text': '#F5F5F0',
        'secondary-text': '#8B9A8E',
        'muted-text': '#5A6B5D',
        'border-subtle': '#262C28',
        'border-default': '#2E3530',
        accent: {
          DEFAULT: '#C5F36B',
          hover: '#D4F88A',
          dim: '#9BC44E',
          muted: 'rgba(197, 243, 107, 0.12)',
        },
        success: {
          DEFAULT: '#4ADE80',
          dim: '#2D7A4F',
          muted: 'rgba(74, 222, 128, 0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dim: '#92610A',
          muted: 'rgba(245, 158, 11, 0.1)',
        },
        error: {
          DEFAULT: '#F87171',
          dim: '#943B3B',
          muted: 'rgba(248, 113, 113, 0.1)',
        },
        'green-normal': '#3D6B4A',
        'green-bare': '#2A4A35',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}

export default config
