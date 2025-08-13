import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';
import { UserDataKeys } from '../constants/user-data';

export const setUserDataValidator = z.object({
  key: z.nativeEnum(UserDataKeys, {
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

export type SetUserDataPayload = z.infer<typeof setUserDataValidator>;
