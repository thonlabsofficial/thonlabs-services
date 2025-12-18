import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { MetadataModelContext } from '@prisma/client';
import z from 'zod';

export const manageMetadataValidator = z.object({
  relationId: z.string({
    required_error: ErrorMessages.RequiredField,
  }),
  context: z.nativeEnum(MetadataModelContext),
  metadata: z.record(
    z.string(),
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.any()),
      z.record(z.any()),
    ]),
  ),
});

export type ManageMetadataPayload = z.infer<typeof manageMetadataValidator>;

export const upsertMetadataValidator = z.object({
  relationId: z.string({
    required_error: ErrorMessages.RequiredField,
  }),
  context: z.nativeEnum(MetadataModelContext),
  key: z.string({
    required_error: ErrorMessages.RequiredField,
  }),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.any()),
    z.null(),
  ]),
});

export type UpsertMetadataPayload = z.infer<typeof upsertMetadataValidator>;
