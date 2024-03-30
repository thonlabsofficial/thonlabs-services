import { AuthProviders } from '@prisma/client';
import z from 'zod';

export const createEnvironmentValidator = z.object({
  name: z.string(),
  appURL: z.string().url(),
  projectId: z.string(),
});

export const updateAuthSettingsValidator = z.object({
  tokenExpiration: z.string(),
  refreshTokenExpiration: z.string().optional().nullable(),
  authProvider: z.nativeEnum(AuthProviders),
});

export const updateGeneralSettingsValidator = z.object({
  name: z.string(),
});
