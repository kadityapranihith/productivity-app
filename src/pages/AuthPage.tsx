import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Card, Button, Input, Logo } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { useNavigate } from 'react-router-dom'

export function AuthPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const login = useAppStore(state => state.login)
  const signup = useAppStore(state => state.signup)
  const loginWithGoogle = useAppStore(state => state.loginWithGoogle)
  const resetPassword = useAppStore(state => state.resetPassword)
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/overview')
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    if (!email.trim()) {
      setError('Please enter your account email address.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSuccessMsg(`Password reset email sent to ${email.trim()}. Please check your inbox.`)
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link. Ensure the email is registered.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (authMode === 'signup') {
        if (!displayName.trim()) {
          setError('Please provide your name.')
          setLoading(false)
          return
        }
        await signup(email.trim(), password, displayName.trim())
      } else {
        await login(email.trim(), password)
      }
      navigate('/overview')
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#101211]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="xl" className="mb-3 justify-center" />
          <h1 className="text-2xl font-bold text-[#F5F5F0] tracking-tight">Barely Productive</h1>
          <p className="text-xs text-[#8B9A8E] mt-1">
            Consistency over intensity. Growing together with accountability.
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 md:p-8 bg-[#181B19] border-[#262C28] shadow-2xl">
          {authMode === 'forgot' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); setSuccessMsg(null); }}
                  className="p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#F5F5F0] hover:bg-[#252A27] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-[#F5F5F0]">Reset Password</h2>
              </div>
              <p className="text-xs text-[#8B9A8E] mb-6 pl-1">
                Enter your account email address and we'll send you instructions to reset your password.
              </p>

              {successMsg ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.25)] rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#4ADE80]">Reset Link Sent</p>
                      <p className="text-xs text-[#8B9A8E] mt-0.5">{successMsg}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => { setAuthMode('signin'); setError(null); setSuccessMsg(null); }}
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    label="Account Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />

                  {error && (
                    <p className="text-xs text-[#F87171] bg-[rgba(248,113,113,0.1)] p-2.5 rounded-lg border border-[rgba(248,113,113,0.2)]">
                      {error}
                    </p>
                  )}

                  <Button type="submit" size="md" className="w-full gap-2 mt-2" loading={loading}>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setError(null); }}
                      className="text-xs text-[#5A6B5D] hover:text-[#8B9A8E] transition-colors"
                    >
                      Remember your password? Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              {/* Tab Switcher */}
              <div className="flex border-b border-[#262C28] pb-4 mb-6">
                <button
                  onClick={() => { setAuthMode('signin'); setError(null); }}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors ${
                    authMode === 'signin' ? 'text-[#C5F36B] border-b-2 border-[#C5F36B]' : 'text-[#5A6B5D] hover:text-[#8B9A8E]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setError(null); }}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors ${
                    authMode === 'signup' ? 'text-[#C5F36B] border-b-2 border-[#C5F36B]' : 'text-[#5A6B5D] hover:text-[#8B9A8E]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#252A27] hover:bg-[#2E3530] text-[#F5F5F0] rounded-xl border border-[#2E3530] text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#262C28]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#181B19] px-2 text-[#5A6B5D]">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <Input
                    label="Display Name"
                    placeholder="e.g. Aditya Sharma"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required={authMode === 'signup'}
                  />
                )}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#8B9A8E]">Password</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setError(null); }}
                        className="text-[11px] text-[#5A6B5D] hover:text-[#C5F36B] transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-xs text-[#F87171] bg-[rgba(248,113,113,0.1)] p-2.5 rounded-lg border border-[rgba(248,113,113,0.2)]">
                    {error}
                  </p>
                )}

                <Button type="submit" size="md" className="w-full gap-2 mt-2" loading={loading}>
                  {authMode === 'signup' ? 'Create Growth Account' : 'Sign In to Workspace'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#5A6B5D]">
          <ShieldCheck className="w-4 h-4 text-[#C5F36B]" />
          <span>Strict Privacy & Row Level Security active</span>
        </div>
      </motion.div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="100%" height="100%">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}
