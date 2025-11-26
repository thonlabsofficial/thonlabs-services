# ThonLabs Backend Monorepo

ThonLabs is an open-source all-in-one platform that gives your SaaS the foundation it needs — with plug-and-play authentication, user and organization management, and more.

Join our waitlist - https://thonlabs.io

## Getting started

This is the backend project and uses Nest.js, Turborepo, Prisma, Docker and Postgres

### How to install

Make sure you have `pnpm` installed, since it's our package manager.

```bash
npm i -g pnpm
```

Install the packages

```bash
pnpm i
```

ThonLabs uses ThonLabs, so you need to create two `.env` files

The first one with a name `.env` will be located at root folder.

```markdown
DATABASE_URL='postgresql://thonlabs:12345678@localhost:5432/thonlabs?schema=public'
DIRECT_URL='postgresql://thonlabs:12345678@localhost:5432/thonlabs?schema=public'
```

The second one with a name `.env.local` will be located at root `apps/auth-services/.env.local`.

```markdown
## THON LABS SERVICES LOCAL ENVS

NODE_ENV=development
APP_ROOT_URL=http://localhost:3000
API_ROOT_URL=http://localhost:3000

## Database - This is your docker postgres db

DATABASE_URL='postgresql://thonlabs:12345678@localhost:5432/thonlabs?schema=public'
DIRECT_URL='postgresql://thonlabs:12345678@localhost:5432/thonlabs?schema=public'

## Secret Keys

## Generate using

## $ node -e "console.log(crypto.randomBytes(32).toString('hex'))"

## Internal API Calls

TL_INTERNAL_API_KEY=<internal_api_key>

## Encode secret keys

ENCODE_SECRET=dev_encode_secret
ENCODE_SECRET_KEYS_SECRET=dev_encode_secret_keys

## Email Provider - Resend

EMAIL_PROVIDER_API_KEY=<your_resend_secret_key>

# AWS

EXT_FILES_BUCKET_NAME=<your_bucket_domain>
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>

# Cloudflare

CLOUDFLARE_BASE_API_URL=https://api.cloudflare.com/client/v4
CLOUDFLARE_ZONE_ID=<your_cloudflare_zone_id>
CLOUDFLARE_API_KEY=-<your_cloudflare_api_key>
```

Run the project

```bash
# Start the database
docker compose up -d

# Run migrations (first time only)
pnpm db:migrate

# Start auth-services in development mode (with hot reload)
pnpm dev:auth

# OR start auth-services in production mode
pnpm run:auth
```

The project will start on port `https://localhost:3100`

### Available Commands

```bash
# Development
pnpm dev              # Run all packages in dev mode
pnpm dev:auth         # Run auth-services in dev mode with hot reload

# Build
pnpm build            # Build all packages
pnpm build:auth       # Build auth-services only

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Prisma Studio

# Email Development
pnpm run:email        # Start react-email dev server

# Code Quality
pnpm lint             # Lint all packages
pnpm test             # Run tests
```
