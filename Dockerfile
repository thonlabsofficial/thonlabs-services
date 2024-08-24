#######################
### PROD DOCKERFILE ###
#######################
FROM node:20.17-slim AS builder

RUN apt-get update -y && \ 
    apt-get install -y openssl

RUN npm install -g pnpm dotenv-cli

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

ENV NODE_ENV production

RUN dotenv -e ./.env.prod -- pnpm db:migrate
RUN rm ./.env.prod

RUN pnpm build:auth

RUN pnpm prune --prod && \
  pnpm store prune
# -------------------------------------------------- #
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT=8080

RUN apt-get update -y && \ 
    apt-get install -y openssl

RUN npm install -g pnpm

COPY --from=builder --chown=thonlabs:nodejs /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder --chown=thonlabs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=thonlabs:nodejs /app/dist ./dist

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 thonlabs

USER thonlabs

CMD ["node", "dist/apps/auth-services/main.js"]
