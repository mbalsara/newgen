# Authentication Setup with BetterAuth

This document explains the authentication setup for the Health Application using BetterAuth.

## Features Implemented

✅ **Username/Password Authentication**
- Traditional email and password login
- Secure password hashing handled by BetterAuth

✅ **Single Sign-On (SSO)**
- Google OAuth
- Apple OAuth
- Microsoft OAuth

✅ **One-Time Password (OTP)**
- Email OTP for passwordless login
- OTP for email verification
- OTP for password reset (forgot password flow)

✅ **Passkeys (WebAuthn)**
- Biometric authentication
- Hardware security key support
- Platform authenticators (Face ID, Touch ID, Windows Hello)

✅ **Forgot Password**
- Email OTP-based password reset
- Secure password update flow

## Architecture

### Server Configuration
- **Location**: `apps/web/src/lib/auth.ts`
- **Database**: PostgreSQL with Drizzle ORM
- **Plugins**: Passkey, Email OTP

### Client Configuration
- **Location**: `apps/web/src/lib/auth-client.ts`
- **Plugins**: Passkey Client, Email OTP Client

### Database Schema
- **Location**: `packages/database/src/auth-schema.ts`
- **Tables**:
  - `user` - User accounts
  - `session` - Active sessions
  - `account` - OAuth accounts and credentials
  - `verification` - Email verification and OTP codes
  - `passkey` - WebAuthn credentials

## Setup Instructions

### 1. Environment Variables

Copy the `.env.example` file and configure your environment:

```bash
cp apps/web/.env.example apps/web/.env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- OAuth provider credentials (Google, Apple, Microsoft)
- Passkey configuration
- Email service credentials (for OTP)

### 2. Database Migration

Run the database migration to create auth tables:

```bash
cd packages/database
pnpm db:push
```

Or generate and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### 3. OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5174/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### Apple OAuth
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Service ID
3. Enable Sign in with Apple
4. Configure return URLs
5. Create a private key
6. Copy credentials to `.env`

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add platform configuration for web
4. Set redirect URI: `http://localhost:5174/api/auth/callback/microsoft`
5. Create client secret
6. Copy Application (client) ID and secret to `.env`

### 4. Email Service Configuration

For OTP functionality, configure an email service provider:

**Option 1: SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

**Option 2: Email Service (Resend, SendGrid, etc.)**
Update `apps/web/src/lib/auth.ts` with your email provider's SDK.

Example with Resend:
```bash
pnpm --filter @repo/web add resend
```

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    await resend.emails.send({
      from: 'noreply@yourapp.com',
      to: email,
      subject: `Your ${type} code`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    })
  },
})
```

## Usage

### Login Page

The login page (`apps/web/src/pages/auth/login.tsx`) provides multiple authentication methods:

1. **Email & Password**
   - Enter email and password
   - Click "Sign in with Email"

2. **Email OTP**
   - Enter email
   - Click "Sign in with OTP"
   - Enter the OTP code sent to email
   - Click "Verify OTP"

3. **Passkey**
   - Click "Sign in with Passkey"
   - Follow browser prompts for biometric/hardware key authentication

4. **Social Login**
   - Click on Google, Apple, or Microsoft button
   - Complete OAuth flow in popup/redirect

### Using Auth in Components

```typescript
import { useSession, useUser } from "@/lib/auth-client"

function MyComponent() {
  const { data: session, isPending } = useSession()
  const { data: user } = useUser()

  if (isPending) return <div>Loading...</div>
  if (!session) return <div>Please sign in</div>

  return <div>Hello, {user?.name}!</div>
}
```

### Sign Out

```typescript
import { authClient } from "@/lib/auth-client"

await authClient.signOut()
```

## API Routes

BetterAuth automatically creates the following API routes:

- `POST /api/auth/sign-in/email` - Email/password sign in
- `POST /api/auth/sign-in/email-otp` - Request OTP
- `POST /api/auth/sign-in/email-otp/verify` - Verify OTP
- `POST /api/auth/sign-in/passkey` - Passkey authentication
- `GET /api/auth/sign-in/social/{provider}` - OAuth initiation
- `GET /api/auth/callback/{provider}` - OAuth callback
- `POST /api/auth/sign-up/email` - Email registration
- `POST /api/auth/sign-out` - Sign out
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/session` - Get current session

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **HTTPS in Production**: Always use HTTPS for production deployments
3. **Passkey RP ID**: Set to your domain in production (e.g., `yourapp.com`)
4. **CORS Configuration**: Configure CORS properly for OAuth redirects
5. **Rate Limiting**: Implement rate limiting for authentication endpoints
6. **Password Policies**: Consider adding password strength requirements

## Troubleshooting

### OAuth redirect URI mismatch
- Ensure redirect URIs in provider console match exactly
- Check for trailing slashes
- Verify http vs https

### OTP not sending
- Check email service configuration
- Verify SMTP credentials
- Check spam/junk folder
- Review console logs for errors

### Passkey not working
- Ensure HTTPS in production (required for WebAuthn)
- Check browser compatibility
- Verify `origin` and `rpID` match your domain

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database user permissions
- Run migrations if tables don't exist

## Next Steps

1. **Add Signup Page**: Create `/auth/signup` with similar UI
2. **Protected Routes**: Implement route guards for authenticated pages
3. **User Profile**: Add profile page with passkey management
4. **2FA**: Consider adding TOTP 2FA for additional security
5. **Session Management**: Add session list and device management
6. **Email Templates**: Create branded email templates for OTP and verification

## Resources

- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [WebAuthn Guide](https://webauthn.guide/)
- [OAuth 2.0 Documentation](https://oauth.net/2/)

## Support

For issues or questions:
- Check BetterAuth docs: https://www.better-auth.com/docs
- Review database schema: `packages/database/src/auth-schema.ts`
- Check server config: `apps/web/src/lib/auth.ts`
- Review client config: `apps/web/src/lib/auth-client.ts`
