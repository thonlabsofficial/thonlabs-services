import { ValidatorErrors } from '@/auth/helpers/validators/validator-errors';
import { z } from 'zod';

export const reauthenticateFromRefreshTokenValidator = z.object({
  token: z.string({ required_error: ValidatorErrors.RequiredField }),
});
