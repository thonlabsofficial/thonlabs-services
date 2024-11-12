import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';

export const setEmailTemplateDomainValidator = z.object({
  domain: z
    .string({ required_error: ErrorMessages.RequiredField })
    .regex(
      /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/,
      { message: ErrorMessages.InvalidDomainFormat },
    )
    .min(1, { message: ErrorMessages.RequiredField }),
});

export type SetEmailTemplateDomainPayload = z.infer<
  typeof setEmailTemplateDomainValidator
>;
