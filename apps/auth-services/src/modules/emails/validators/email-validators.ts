import { z } from 'zod';
import { InternalEmailFrom } from '@/auth/modules/emails/constants/email';

export const sendInternalEmailValidator = z.object({
  from: z.nativeEnum(InternalEmailFrom),
  to: z.string().email(),
  subject: z.string(),
  content: z.any(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type SendInternalEmailPayload = z.infer<
  typeof sendInternalEmailValidator
>;
