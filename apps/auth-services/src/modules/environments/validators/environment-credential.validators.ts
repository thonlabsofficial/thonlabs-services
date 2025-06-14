import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';

export const createCredentialValidator = z.object({
  clientId: z.string({ required_error: ErrorMessages.RequiredField }).min(1, {
    message: ErrorMessages.RequiredField,
  }),
  secretKey: z.string({ required_error: ErrorMessages.RequiredField }).min(1, {
    message: ErrorMessages.RequiredField,
  }),
  redirectURI: z
    .string({ required_error: ErrorMessages.RequiredField })
    .url({ message: ErrorMessages.InvalidURL }),
});

export type CreateCredentialPayload = z.infer<typeof createCredentialValidator>;

export const updateCredentialStatusValidator = z.object({
  active: z.boolean(),
});

export type UpdateCredentialStatusPayload = z.infer<
  typeof updateCredentialStatusValidator
>;
