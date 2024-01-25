import z from 'zod';
import { ErrorMessages } from '@/utils/enums/errors-metadata';

export const createProjectValidator = z.object({
  name: z.string({ required_error: ErrorMessages.RequiredField }),
});
