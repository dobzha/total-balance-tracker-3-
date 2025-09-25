'use client'

import { useAuth } from '@/contexts/AuthContext'
import { GoogleSignInButton } from './GoogleSignInButton'
import { UserProfile } from './UserProfile'

export function AuthComponent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {user ? <UserProfile /> : <GoogleSignInButton />}
    </div>
  )
}