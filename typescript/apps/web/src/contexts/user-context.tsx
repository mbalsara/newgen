import * as React from 'react'
import { api } from '@/lib/api-client'

// Simplified user type for context
interface User {
  id: string
  name: string
  type: 'ai' | 'staff'
  role: string
  avatar: string | null
}

interface UserContextValue {
  currentUser: User
  setCurrentUser: (user: User) => void
  availableUsers: User[]
  loading: boolean
}

const UserContext = React.createContext<UserContextValue | null>(null)

// Default user for initial render (before API loads)
const defaultUser: User = {
  id: 'sarah',
  name: 'Sarah M.',
  type: 'staff',
  role: 'Front Office',
  avatar: 'SM',
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<User>(defaultUser)
  const [availableUsers, setAvailableUsers] = React.useState<User[]>([defaultUser])
  const [loading, setLoading] = React.useState(true)

  // Fetch staff members from API
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const agents = await api.agents.staff()
        const staffUsers: User[] = agents.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type as 'ai' | 'staff',
          role: a.role,
          avatar: a.avatar,
        }))

        if (staffUsers.length > 0) {
          setAvailableUsers(staffUsers)
          // Update current user if it exists in the fetched list
          const existingUser = staffUsers.find(u => u.id === currentUser.id)
          if (existingUser) {
            setCurrentUser(existingUser)
          } else {
            setCurrentUser(staffUsers[0])
          }
        }
      } catch (err) {
        console.error('Error fetching staff:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  const value: UserContextValue = {
    currentUser,
    setCurrentUser,
    availableUsers,
    loading,
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
