import { z } from 'zod';
import { CompetitorsAuthProviders } from '@/auth/modules/internals/constants/competitors-auth-providers';
import { ErrorMessages } from '@/utils/enums/errors-metadata';

export const joinWaitlistFormSchema = z.object({
  fullName: z.string().min(1, { message: ErrorMessages.RequiredField }),
  email: z.string().email({ message: ErrorMessages.RequiredField }),
  currentProvider: z.nativeEnum(CompetitorsAuthProviders, {
    required_error: ErrorMessages.RequiredField,
  }),
});

export type JoinWaitlistForm = z.infer<typeof joinWaitlistFormSchema>;
