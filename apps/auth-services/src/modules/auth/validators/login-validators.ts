import z from 'zod';
import { ErrorMessages } from '@/utils/enums/errors-metadata';

export const loginValidator = z.object({
  email: z
    .string({ required_error: ErrorMessages.InvalidCredentials })
    .email({ message: ErrorMessages.InvalidCredentials }),
  password: z.string().optional().nullable(),
});

export const authenticateFromMagicLinkValidator = z.object({
  token: z.string({ required_error: ErrorMessages.RequiredField }),
});

export const reauthenticateFromRefreshTokenValidator = z.object({
  token: z.string({ required_error: ErrorMessages.RequiredField }),
});
