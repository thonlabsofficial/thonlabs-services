import { ValidatorErrors } from '@/auth/helpers/validators/validator-errors';
import { z } from 'zod';

export const loginOrCreateFromMagicLinkValidator = z.object({
  email: z
    .string({ required_error: ValidatorErrors.RequiredField })
    .email({ message: ValidatorErrors.InvalidEmail }),
});
