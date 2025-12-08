import { createAuthClient } from "better-auth/client"
import { passkeyClient } from "better-auth/client/plugins"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5174",
  plugins: [
    passkeyClient(),
    emailOTPClient(),
  ],
})

// Helper hooks and utilities
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useUser,
} = authClient
