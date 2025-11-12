import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';
import { UserSubscriptionType } from '../constants/user-data';

export const upsertUserSubscriptionValidator = z.object({
  userEmail: z.string().email(ErrorMessages.InvalidEmail),
  sessionRefId: z.string(),
  paymentRefId: z.string(),
  userRefId: z.string(),
  mode: z.enum(['subscription', 'payment']),
  type: z.nativeEnum(UserSubscriptionType),
});

export type UpsertUserSubscriptionPayload = z.infer<
  typeof upsertUserSubscriptionValidator
>;
