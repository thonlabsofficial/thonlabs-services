import z from 'zod';
import { passwordPatterns } from '@/utils/validators/patterns';
import { ErrorMessages } from '@/utils/enums/errors-metadata';

export const requestResetPasswordValidator = z.object({
  email: z
    .string({ required_error: ErrorMessages.RequiredField })
    .email({ message: ErrorMessages.InvalidEmail }),
  password: z
    .string()
    .regex(passwordPatterns.middleStrength)
    .optional()
    .nullable(),
});

export const newPasswordValidator = z
  .object({
    password: z
      .string({ required_error: 'This field is required' })
      .regex(passwordPatterns.middleStrength, { message: 'Password is weak' }),
    confirm: z.string({ required_error: 'This field is required' }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords must be equals',
    path: ['confirm'],
  });
