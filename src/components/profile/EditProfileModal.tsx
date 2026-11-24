import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, Link as LinkIcon } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { useAppStore } from '@/lib/store'

const AVATAR_PRESETS = [
  { name: 'Aditya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya' },
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { name: 'Aneka', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { name: 'Zack', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack' },
  { name: 'Midnight', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight' },
  { name: 'Oliver', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
  { name: 'Nova', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova' },
  { name: 'Aria', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria' },
]

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const user = useAppStore(state => state.user)
  const profile = useAppStore(state => state.profile)
  const updateUserProfile = useAppStore(state => state.updateUserProfile)

  const [displayName, setDisplayName] = useState(user.display_name)
  const [bio, setBio] = useState(profile.bio || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_url || AVATAR_PRESETS[0].url)
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [useCustomUrl, setUseCustomUrl] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.display_name)
      setBio(profile.bio || '')
      setSelectedAvatar(user.avatar_url || AVATAR_PRESETS[0].url)
      setCustomAvatarUrl('')
      setUseCustomUrl(false)
    }
  }, [isOpen, user.display_name, user.avatar_url, profile.bio])

  if (!isOpen) return null

  const handleRandomAvatar = () => {
    const seed = 'avatar-' + Math.random().toString(36).substring(2, 9)
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    setSelectedAvatar(url)
    setUseCustomUrl(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const finalAvatar = useCustomUrl && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : selectedAvatar

    updateUserProfile({
      display_name: displayName.trim() || user.display_name,
      bio: bio.trim(),
      avatar_url: finalAvatar,
    })
    onClose()
  }

  const currentPreview = useCustomUrl && customAvatarUrl.trim() ? customAvatarUrl : selectedAvatar

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
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#181B19] border border-[#262C28] rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#262C28] mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F0]">Edit Profile</h2>
              <p className="text-xs text-[#5A6B5D] mt-0.5">
                Update your public profile and avatar appearance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#F5F5F0] hover:bg-[#252A27] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar Preview & Selection */}
            <div>
              <label className="text-xs font-semibold text-[#8B9A8E] block mb-2">
                Profile Avatar
              </label>

              {/* Preview Row */}
              <div className="flex items-center gap-4 mb-4 p-3.5 bg-[#1E2220] rounded-xl border border-[#262C28]">
                <div className="relative shrink-0">
                  <img
                    src={currentPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover bg-[#252A27] border-2 border-[#C5F36B] shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = AVATAR_PRESETS[0].url
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#F5F5F0]">Avatar Style</p>
                  <p className="text-[11px] text-[#5A6B5D] mt-0.5 mb-2.5">
                    Pick a curated style or generate a random one.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRandomAvatar}
                    className="gap-1.5 text-xs py-1 px-3 border-[#2E3530] text-[#F5F5F0] hover:text-[#C5F36B]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5F36B]" />
                    Generate Random
                  </Button>
                </div>
              </div>

              {/* Preset options */}
              <p className="text-xs text-[#8B9A8E] mb-2 font-medium">
                Curated Presets:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = !useCustomUrl && selectedAvatar === preset.url
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url)
                        setUseCustomUrl(false)
                      }}
                      className={`relative p-1 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#C5F36B] bg-[rgba(197,243,107,0.1)] shadow-[0_0_10px_rgba(197,243,107,0.2)]'
                          : 'border-[#262C28] bg-[#1E2220] hover:border-[#3E4A40]'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#C5F36B] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[#101211]" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Custom Image URL option toggle */}
              <div>
                {!useCustomUrl ? (
                  <button
                    type="button"
                    onClick={() => setUseCustomUrl(true)}
                    className="text-xs text-[#8B9A8E] hover:text-[#C5F36B] transition-colors underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Use custom image URL instead
                  </button>
                ) : (
                  <div className="space-y-1.5 mt-2 p-3 bg-[#1E2220] rounded-xl border border-[#262C28]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8B9A8E]">Image URL:</span>
                      <button
                        type="button"
                        onClick={() => setUseCustomUrl(false)}
                        className="text-[11px] text-[#5A6B5D] hover:text-[#F87171]"
                      >
                        Cancel
                      </button>
                    </div>
                    <Input
                      placeholder="https://example.com/avatar.png"
                      value={customAvatarUrl}
                      onChange={e => setCustomAvatarUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Input
                label="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name or alias"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <Textarea
                label="Bio / Accountability Motto"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="What are you building consistency around? e.g. Daily coding and health commitments."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262C28]">
              <Button type="button" variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="md">
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
