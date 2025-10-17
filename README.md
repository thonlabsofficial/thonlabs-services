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
CLOUDFLARE_API_KEY=-<your_cloudflare_api_key>
```

Run the project

```bash
docker compose up -d
pnpm db:migrate # First time only
pnpm run:auth
```

The project will start on port `https://localhost:3100`
