# Monorepo

Full-stack TypeScript monorepo with React, Express, and PostgreSQL.

## Structure

```
├── apps/
│   ├── api/          # Express API server
│   └── web/          # Vite + React physician office application
├── packages/
│   ├── database/     # Drizzle ORM & schema
│   └── types/        # Shared TypeScript types
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: Vite, React 18, Tailwind CSS, Shadcn UI, TanStack Table
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: BetterAuth (Email/Password, OAuth, OTP, Passkeys)
- **AI**: Vercel AI SDK
- **Build**: Turbo (monorepo), tsup, pnpm
- **Testing**: Vitest
- **Linting**: ESLint, Prettier
- **Infrastructure**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- Docker & Docker Compose (optional)

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

1. Copy `.env.example` to `.env` in both `apps/api/` and `apps/web/`:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. Update `DATABASE_URL` in both `.env` files

3. Configure authentication variables in `apps/web/.env`:
   - OAuth credentials (Google, Apple, Microsoft)
   - Passkey settings
   - Email service for OTP (see [Authentication Setup](#authentication))

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Or run individual apps:

```bash
# API only
pnpm --filter @repo/api dev

# Web only
pnpm --filter @repo/web dev
```

### Docker

Start all services with Docker:

```bash
docker-compose up
```

Services:
- Web: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432

### Database

Push schema to database (creates/updates tables):

```bash
pnpm --filter @repo/database db:push
```

Generate migrations:

```bash
pnpm --filter @repo/database db:generate
```

Run migrations:

```bash
pnpm --filter @repo/database db:migrate
```

Open Drizzle Studio:

```bash
pnpm --filter @repo/database db:studio
```

**Note**: After setting up authentication, run `db:push` to create the auth tables (user, session, account, verification, passkey).

### Build

Build all packages and apps:

```bash
pnpm build
```

### Testing

Run all tests:

```bash
pnpm test
```

### Linting

Lint all code:

```bash
pnpm lint
```

Format code:

```bash
pnpm format
```

## Scripts

- `pnpm dev` - Start all apps in development
- `pnpm build` - Build all apps and packages with Turbo
- `pnpm test` - Run all tests with Vitest
- `pnpm lint` - Lint all apps and packages with ESLint
- `pnpm clean` - Clean build artifacts
- `pnpm format` - Format code with Prettier

## Workspaces

- `@repo/api` - Express API (built with tsup)
- `@repo/web` - Vite + React physician office application
- `@repo/database` - Database layer (built with tsup)
- `@repo/types` - Shared types (built with tsup)

---

## Authentication

The application uses **BetterAuth** for comprehensive authentication and authorization.

### Supported Authentication Methods

✅ **Email & Password** - Traditional username/password authentication
✅ **Email OTP** - One-time password sent via email (passwordless)
✅ **Passkeys (WebAuthn)** - Biometric authentication (Face ID, Touch ID, Windows Hello)
✅ **OAuth Providers** - Single Sign-On with:
  - Google
  - Apple
  - Microsoft

✅ **Forgot Password** - Email OTP-based password reset

### Quick Start

1. **Access the login page**:
   ```
   http://localhost:5174/auth/login
   ```

2. **Configure environment variables** in `apps/web/.env`:
   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/health_db

   # OAuth Providers
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   APPLE_CLIENT_ID=your_apple_client_id
   APPLE_CLIENT_SECRET=your_apple_client_secret

   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

   # Passkey Configuration
   PASSKEY_RP_ID=localhost
   PASSKEY_RP_NAME=Health Application
   PASSKEY_ORIGIN=http://localhost:5174
   ```

3. **Set up database schema**:
   ```bash
   pnpm --filter @repo/database db:push
   ```

4. **Configure email service** for OTP (optional but recommended):
   - Update `apps/web/src/lib/auth.ts` with your email provider
   - Options: SMTP, Resend, SendGrid, etc.
   - See `AUTH_SETUP.md` for detailed instructions

### Authentication Files

- **Server Config**: `apps/web/src/lib/auth.ts`
- **Client Config**: `apps/web/src/lib/auth-client.ts`
- **Database Schema**: `packages/database/src/auth-schema.ts`
- **Login UI**: `apps/web/src/pages/auth/login.tsx`
- **Environment Template**: `apps/web/.env.example`

### Complete Documentation

For detailed setup instructions, OAuth provider configuration, and troubleshooting:

📖 **See [AUTH_SETUP.md](./AUTH_SETUP.md)**

This includes:
- OAuth provider setup guides (Google, Apple, Microsoft)
- Email service configuration
- Passkey setup for production
- API routes reference
- Usage examples
- Security best practices
- Troubleshooting guide

### Database Schema

The authentication system creates the following tables:

- `user` - User accounts and profiles
- `session` - Active user sessions
- `account` - OAuth accounts and password credentials
- `verification` - Email verification and OTP codes
- `passkey` - WebAuthn/FIDO2 credentials

---

## Deployment to Google Cloud Run

The web application automatically deploys to Google Cloud Run via GitHub Actions on every push to `main` branch.

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **GitHub Repository** with the monorepo code
3. **Required GCP APIs** enabled:
   - Cloud Run API
   - Artifact Registry API
   - IAM Service Account Credentials API

### One-Time GCP Setup

#### 1. Create a Google Cloud Project

```bash
export PROJECT_ID="health-474623"  # Your GCP project ID
export REGION="us-central1"
export SERVICE_NAME="health-web"

# Set active project
gcloud config set project $PROJECT_ID

# Verify project is set
gcloud config get-value project

# Enable billing (if not already enabled)
gcloud beta billing accounts list
gcloud beta billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

#### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com
```

#### 3. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create physician-office-web \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for physician office app"
```

#### 4. Set Up Workload Identity Federation

This allows GitHub Actions to authenticate to GCP without storing service account keys.

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

export SA_EMAIL="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Get the pool ID
export WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" \
  --location="global" \
  --format="value(name)")

# Create Workload Identity Provider
export REPO="mbalsara/newgen"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository == '${REPO}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub Actions from your repo to impersonate the service account

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO}"

# Get the Workload Identity Provider name (needed for GitHub secrets)
echo "WIF_PROVIDER:"
gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"

echo "WIF_SERVICE_ACCOUNT: ${SA_EMAIL}"
```

### GitHub Secrets Setup

Add the following secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

1. **GCP_PROJECT_ID**
   - Value: Your GCP project ID (e.g., `my-project-12345`)

2. **WIF_PROVIDER**
   - Value: Full workload identity provider path from setup step
   - Format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

3. **WIF_SERVICE_ACCOUNT**
   - Value: Service account email
   - Format: `github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com`

### Deployment Process

#### Automatic Deployment

Every push to the `main` branch automatically triggers deployment:

```bash
git add .
git commit -m "Deploy to Cloud Run"
git push origin main
```

The GitHub Actions workflow will:
1. ✅ Install dependencies
2. ✅ Build the application
3. ✅ Authenticate to Google Cloud
4. ✅ Build Docker image
5. ✅ Push to Artifact Registry
6. ✅ Deploy to Cloud Run
7. ✅ Output the live URL

#### Manual Deployment

You can also trigger deployment manually:

1. Go to `Actions` tab in GitHub
2. Select "Deploy to Cloud Run" workflow
3. Click "Run workflow"
4. Select branch and click "Run"

#### Local Docker Build (Optional)

Test the Docker build locally before deploying:

```bash
# Build image
docker build -t health-web -f apps/web/Dockerfile .

# Run locally
docker run -p 8080:8080 health-web

# Visit http://localhost:8080
```

### Monitoring & Management

#### View Deployment Status

```bash
# List Cloud Run services
gcloud run services list --region=$REGION

# Describe the service
gcloud run services describe $SERVICE_NAME --region=$REGION

# View logs
gcloud run services logs read $SERVICE_NAME --region=$REGION

# Follow logs in real-time
gcloud run services logs tail $SERVICE_NAME --region=$REGION
```

#### Update Service Configuration

```bash
# Scale min/max instances
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --min-instances=0 \
  --max-instances=10

# Update memory/CPU
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --memory=1Gi \
  --cpu=2

# Set environment variables
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="NODE_ENV=production,API_URL=https://api.example.com"
```

#### Access the Deployed Application

After deployment, your application will be available at:
```
https://health-web-RANDOM_ID-uc.a.run.app
```

The exact URL is shown in:
- GitHub Actions deployment summary
- Cloud Run console
- Command output: `gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'`

### Cost Optimization

Cloud Run pricing is based on:
- **CPU & Memory**: Only charged when handling requests
- **Requests**: First 2 million requests/month are free
- **Networking**: Outbound data transfer

**Recommended settings for cost optimization:**
- `--min-instances=0` (scale to zero when idle)
- `--memory=512Mi` (adequate for static SPA)
- `--cpu=1` (sufficient for nginx)
- `--max-instances=10` (prevent runaway costs)

### Troubleshooting

#### Build Failures

Check GitHub Actions logs:
```bash
# View recent workflow runs
gh run list --workflow=deploy-cloud-run.yml

# View specific run logs
gh run view RUN_ID --log
```

#### Deployment Failures

```bash
# Check Cloud Run service events
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.conditions)'

# View revision details
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION
```

#### Application Errors

```bash
# Stream logs
gcloud run services logs tail $SERVICE_NAME --region=$REGION

# Filter by severity
gcloud run services logs read $SERVICE_NAME \
  --region=$REGION \
  --log-filter='severity>=ERROR'
```

### Cleanup

To remove all deployed resources:

```bash
# Delete Cloud Run service
gcloud run services delete $SERVICE_NAME --region=$REGION

# Delete Artifact Registry repository
gcloud artifacts repositories delete physician-office-web --location=$REGION

# Delete service account
gcloud iam service-accounts delete $SA_EMAIL

# Delete Workload Identity Pool
gcloud iam workload-identity-pools delete github-pool --location=global
```

---

## Architecture

### Production Deployment

```
GitHub (push to main)
    ↓
GitHub Actions
    ↓
Build Docker Image (multi-stage)
    ↓
Google Artifact Registry
    ↓
Cloud Run (nginx serving static files)
    ↓
Users
```

### Docker Image Layers

1. **Base**: Node.js 18 Alpine
2. **Dependencies**: pnpm install (cached)
3. **Build**: Vite production build
4. **Runtime**: nginx Alpine (minimal)

**Final image size**: ~50MB (optimized)

---
