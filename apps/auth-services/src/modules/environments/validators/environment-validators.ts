import z from 'zod';

export const createEnvironmentValidator = z.object({
  name: z.string(),
  appURL: z.string().url(),
  projectId: z.string(),
});

export const updateTokenSettingsValidator = z.object({
  tokenExpiration: z.string(),
  refreshTokenExpiration: z.string().optional().nullable(),
});
