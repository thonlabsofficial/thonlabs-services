import z from 'zod';

export const createUserValidator = z.object({
  fullName: z
    .string({ required_error: 'User full name is required' })
    .refine((value) => value.trim().split(' ').length >= 2, {
      message: 'Please enter the full name',
    }),
  email: z
    .string({ required_error: 'User email is required' })
    .email({ message: 'Email is invalid' }),
  organizationId: z.string().optional(),
});

export const updateUserGeneralDataValidator = z.object({
  fullName: z
    .string({ required_error: 'User full name is required' })
    .refine((value) => value.trim().split(' ').length >= 2, {
      message: 'Please enter the full name',
    }),
  organizationId: z.string().optional(),
});

export type UpdateUserGeneralDataPayload = z.infer<
  typeof updateUserGeneralDataValidator
>;

export const updateStatusValidator = z.object({
  active: z.boolean({ required_error: 'User status is required' }),
});
