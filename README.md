# ThonLabs Backend

ThonLabs is an open-source all-in-one platform that gives your SaaS the foundation it needs — with plug-and-play authentication, user and organization management, and more.

Join our waitlist - https://thonlabs.io

## Getting started

This is the backend project and uses NestJS, Prisma, Docker and PostgreSQL.

### How to install

Make sure you have `pnpm` installed, since it's our package manager.

```bash
npm i -g pnpm
```

Install the packages

```bash
pnpm install
```

ThonLabs uses ThonLabs, so you need to create a `.env.local` file at the root folder:

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
##    $ node -e "console.log(crypto.randomBytes(32).toString('hex'))"

## Internal API Calls
TL_INTERNAL_API_KEY=<internal_api_key>

## Encode secret keys
AUTHENTICATION_SECRET=dev_auth_secret_key
ENCODE_SECRET=dev_encode_secret
ENCODE_SECRET_KEYS_SECRET=dev_encode_secret_keys
ENCODE_AUTH_KEYS_SECRET=dev_encode_auth_keys

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
CLOUDFLARE_API_KEY=<your_cloudflare_api_key>
```

Run the project

```bash
# Start the database
docker compose up -d

# Generate Prisma client
pnpm prisma:generate

# Run migrations (first time only)
pnpm prisma:migrate

# Start in development mode (with hot reload)
pnpm start:dev

# OR start in production mode
pnpm start:prod
```

The project will start on port `https://localhost:3100`

### Available Commands

```bash
# Development
pnpm start:dev        # Run in development mode with hot reload
pnpm start:debug      # Run in debug mode
pnpm start:prod       # Run in production mode

# Build
pnpm build            # Build the project

# Database (Prisma)
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations in production
pnpm prisma:migrate:dev # Create and run migrations in development
pnpm prisma:push      # Push schema changes without migration
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:reset     # Reset database

# Email Development
pnpm email:dev        # Start react-email dev server
pnpm email:export     # Export email templates

# Code Quality
pnpm lint             # Lint the codebase
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:cov         # Run tests with coverage
```

## Project Structure

```
/workspace
├── src/
│   ├── modules/          # NestJS modules
│   ├── packages/         # Internal packages (utils, ui, react-email)
│   └── database/         # Prisma schema and migrations
├── dist/                 # Build output
├── package.json          # Single package.json for the entire project
├── tsconfig.json         # TypeScript configuration
├── nest-cli.json         # NestJS CLI configuration
└── Dockerfile.build      # Docker build configuration
```
