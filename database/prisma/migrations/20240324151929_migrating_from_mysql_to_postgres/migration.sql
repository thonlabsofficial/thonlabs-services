-- CreateEnum
CREATE TYPE "TokenTypes" AS ENUM ('MagicLogin', 'Refresh', 'ConfirmEmail', 'ResetPassword', 'InviteUser');

-- CreateEnum
CREATE TYPE "CustomFieldTypes" AS ENUM ('String', 'Int', 'Boolean', 'JSON');

-- CreateEnum
CREATE TYPE "CustomFieldRelationsTypes" AS ENUM ('User', 'CMS');

-- CreateEnum
CREATE TYPE "ProjectConfigRelationTypes" AS ENUM ('CustomFields', 'UserRoles');

-- CreateEnum
CREATE TYPE "EmailTemplates" AS ENUM ('Welcome', 'MagicLink', 'ConfirmEmail', 'ForgotPassword', 'Invite');

-- CreateEnum
CREATE TYPE "AuthProviders" AS ENUM ('MagicLogin', 'EmailAndPassword');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT NOT NULL,
    "profilePicture" TEXT,
    "password" TEXT,
    "lastSignIn" TIMESTAMP(3),
    "authKey" TEXT,
    "thonLabsUser" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT,
    "roleId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_subscriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentProviderSubscriptionId" TEXT,
    "userId" TEXT,

    CONSTRAINT "users_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userOwnerId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomFieldTypes" NOT NULL,
    "relationType" "CustomFieldRelationsTypes" NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "publicKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "tokenExpiration" TEXT NOT NULL DEFAULT '1d',
    "refreshTokenExpiration" TEXT DEFAULT '10d',
    "appURL" TEXT,
    "authProvider" "AuthProviders" NOT NULL DEFAULT 'MagicLogin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_configs_on_environments" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT NOT NULL,
    "relationId" TEXT NOT NULL,
    "relationType" "ProjectConfigRelationTypes" NOT NULL,

    CONSTRAINT "projects_configs_on_environments_pkey" PRIMARY KEY ("environmentId","projectId")
);

-- CreateTable
CREATE TABLE "emails_templates" (
    "id" TEXT NOT NULL,
    "type" "EmailTemplates" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "preview" TEXT,
    "replyTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT NOT NULL,

    CONSTRAINT "emails_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails_domains" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT NOT NULL,

    CONSTRAINT "emails_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_storage" (
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TokenTypes" NOT NULL,
    "relationId" TEXT NOT NULL,

    CONSTRAINT "tokens_storage_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "environments_publicKey_key" ON "environments"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "environments_secretKey_key" ON "environments"("secretKey");

-- CreateIndex
CREATE UNIQUE INDEX "emails_domains_externalId_key" ON "emails_domains"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "emails_domains_domain_key" ON "emails_domains"("domain");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_subscriptions" ADD CONSTRAINT "users_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userOwnerId_fkey" FOREIGN KEY ("userOwnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_configs_on_environments" ADD CONSTRAINT "projects_configs_on_environments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_configs_on_environments" ADD CONSTRAINT "projects_configs_on_environments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails_templates" ADD CONSTRAINT "emails_templates_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails_domains" ADD CONSTRAINT "emails_domains_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
