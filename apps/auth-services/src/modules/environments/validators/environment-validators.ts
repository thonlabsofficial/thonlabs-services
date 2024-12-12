import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { AuthProviders } from '@prisma/client';
import z from 'zod';

export const createEnvironmentValidator = z.object({
  name: z
    .string({ required_error: ErrorMessages.RequiredField })
    .max(25, ErrorMessages.MaxLength),
  appURL: z.string({ required_error: ErrorMessages.RequiredField }).url(),
  projectId: z.string({ required_error: ErrorMessages.RequiredField }),
});

export const updateAuthSettingsValidator = z.object({
  tokenExpiration: z.string(),
  refreshTokenExpiration: z.string().optional().nullable(),
  authProvider: z.nativeEnum(AuthProviders),
  enableSignUp: z.boolean(),
  enableSignUpB2BOnly: z.boolean(),
});

export type UpdateAuthSettingsValidator = z.infer<
  typeof updateAuthSettingsValidator
>;

export const updateGeneralSettingsValidator = z.object({
  name: z
    .string({ required_error: ErrorMessages.RequiredField })
    .max(25, ErrorMessages.MaxLength),
  appURL: z.string({ required_error: ErrorMessages.RequiredField }).url(),
});

export type UpdateGeneralSettingsValidator = z.infer<
  typeof updateGeneralSettingsValidator
>;
