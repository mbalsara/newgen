import * as React from 'react'
import { staffMembers } from '@/lib/mock-agents'
import type { VoiceAgent } from '@/lib/task-types'

interface UserContextValue {
  currentUser: VoiceAgent
  setCurrentUser: (user: VoiceAgent) => void
  availableUsers: VoiceAgent[]
}

const UserContext = React.createContext<UserContextValue | null>(null)

// Default to Sarah M. (Front Office)
const defaultUser = staffMembers[0]

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<VoiceAgent>(defaultUser)

  const value: UserContextValue = {
    currentUser,
    setCurrentUser,
    availableUsers: staffMembers,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useCurrentUser() {
  const context = React.useContext(UserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }
  return context
}
