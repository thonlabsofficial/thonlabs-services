import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';

export const setEnvironmentDataValidator = z.object({
  id: z.string({ required_error: ErrorMessages.RequiredField }).min(1, {
    message: ErrorMessages.RequiredField,
  }),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.any()),
  ]),
});
