import z from 'zod';
import { passwordPatterns } from '@/utils/validators/password-patterns';
import { ErrorMessages } from '@/utils/enums/errors-metadata';

export const signUpValidator = z.object({
  fullName: z.string(),
  email: z
    .string({ required_error: ErrorMessages.RequiredField })
    .email({ message: ErrorMessages.InvalidEmail }),
  password: z
    .string()
    .regex(passwordPatterns.middleStrength)
    .optional()
    .nullable(),
});
