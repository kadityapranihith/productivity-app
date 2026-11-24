// Firebase authentication initialization
// Set environment variables in .env.local

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

if (!hasFirebaseConfig) {
  console.warn(
    '[Firebase] Firebase environment variables are not set.\n' +
    'Set VITE_FIREBASE_* variables in .env.local to enable authentication.'
  )
}

export let firebaseApp: ReturnType<typeof initializeApp> | null = null
export let firebaseAuth: ReturnType<typeof getAuth> | null = null

if (hasFirebaseConfig) {
  try {
    firebaseApp = initializeApp(firebaseConfig)
    firebaseAuth = getAuth(firebaseApp)
  } catch (e) {
    console.error('[Firebase] Failed to initialize:', e)
  }
}

export const isMockAuth = !hasFirebaseConfig
