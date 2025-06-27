import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';

export const createSSOCredentialValidator = z.object({
  clientId: z
    .string({ required_error: ErrorMessages.RequiredField })
    .min(1, {
      message: ErrorMessages.RequiredField,
    })
    .max(255, { message: ErrorMessages.MaxLength }),
  secretKey: z
    .string({ required_error: ErrorMessages.RequiredField })
    .min(1, {
      message: ErrorMessages.RequiredField,
    })
    .max(255, { message: ErrorMessages.MaxLength }),
  redirectURI: z
    .string({ required_error: ErrorMessages.RequiredField })
    .url({ message: ErrorMessages.InvalidURL })
    .max(255, { message: ErrorMessages.MaxLength }),
});

export type CreateSSOCredentialPayload = z.infer<
  typeof createSSOCredentialValidator
>;

export const createEmailProviderCredentialValidator = z.object({
  secretKey: z
    .string({ required_error: ErrorMessages.RequiredField })
    .min(1, { message: ErrorMessages.RequiredField })
    .max(255, { message: ErrorMessages.MaxLength }),
});

export type CreateEmailProviderCredentialPayload = z.infer<
  typeof createEmailProviderCredentialValidator
>;

export const updateCredentialStatusValidator = z.object({
  active: z.boolean(),
});

export type UpdateCredentialStatusPayload = z.infer<
  typeof updateCredentialStatusValidator
>;
