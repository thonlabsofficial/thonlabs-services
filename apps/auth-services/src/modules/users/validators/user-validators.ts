import z from 'zod';

export const createUserValidator = z.object({
  fullName: z.string({ required_error: 'User full name is required' }),
  email: z
    .string({ required_error: 'User email is required' })
    .email({ message: 'Email is invalid' }),
});
