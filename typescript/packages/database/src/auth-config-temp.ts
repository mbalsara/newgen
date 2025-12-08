import { betterAuth } from "better-auth"
import { passkey } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins"

// Temporary config for schema generation only
export const auth = betterAuth({
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: "temp",
      clientSecret: "temp",
    },
    apple: {
      clientId: "temp",
      clientSecret: "temp",
    },
    microsoft: {
      clientId: "temp",
      clientSecret: "temp",
    },
  },
  plugins: [
    passkey({
      rpID: "localhost",
      rpName: "Health Application",
      origin: "http://localhost:5174",
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`OTP for ${email} (${type}): ${otp}`)
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
    }),
  ],
})
