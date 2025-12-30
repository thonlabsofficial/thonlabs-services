import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { AuthProviders } from '@prisma/client';
import z from 'zod';
import { colorPatterns } from '@/utils/validators/patterns';

export const createEnvironmentValidator = z.object({
  name: z
    .string({ required_error: ErrorMessages.RequiredField })
    .max(25, ErrorMessages.MaxLength),
  appURL: z.string({ required_error: ErrorMessages.RequiredField }).url(),
  projectId: z.string({ required_error: ErrorMessages.RequiredField }),
  copyFromEnvironmentId: z.string().optional(),
  copyOptions: z
    .object({
      authBuilderOptions: z.boolean().optional(),
      credentials: z.boolean().optional(),
      emailTemplates: z.boolean().optional(),
      metadataModels: z.boolean().optional(),
    })
    .optional(),
});

export const updateAuthSettingsValidator = z.object({
  tokenExpiration: z.string(),
  refreshTokenExpiration: z.string().optional().nullable(),
  authProvider: z.nativeEnum(AuthProviders),
  enableSignUp: z.boolean(),
  enableSignUpB2BOnly: z.boolean(),
  styles: z.object({
    primaryColor: z
      .string({ required_error: ErrorMessages.RequiredField })
      .refine(
        (color) =>
          colorPatterns.hexColor.test(color) ||
          colorPatterns.rgbColor.test(color),
        { message: ErrorMessages.InvalidColorFormat },
      ),
  }),
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
