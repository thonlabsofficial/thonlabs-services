import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';
import { AppDataKeys } from '@/auth/modules/app/constants/app-data';

export const setAppDataValidator = z.object({
  key: z.nativeEnum(AppDataKeys, {
    required_error: ErrorMessages.RequiredField,
  }),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.any()),
  ]),
});

export type SetAppDataPayload = z.infer<typeof setAppDataValidator>;
