import z from 'zod';

export const createEnvironmentValidator = z.object({
  name: z.string(),
  appURL: z.string().url(),
  projectId: z.string(),
});
