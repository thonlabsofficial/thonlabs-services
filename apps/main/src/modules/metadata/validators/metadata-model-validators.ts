import { ErrorMessages } from '@/utils/enums/errors-metadata';
import z from 'zod';
import { MetadataModelType, MetadataModelContext } from '@prisma/client';

export const createMetadataModelValidator = z
  .object({
    name: z
      .string({
        required_error: ErrorMessages.RequiredField,
      })
      .min(1, ErrorMessages.RequiredField),
    key: z
      .string({
        required_error: ErrorMessages.RequiredField,
      })
      .min(1, ErrorMessages.RequiredField),
    description: z.string().optional(),
    type: z.nativeEnum(MetadataModelType, {
      required_error: ErrorMessages.RequiredField,
    }),
    options: z
      .array(
        z.object({
          label: z.string().min(1, 'Label is required'),
          value: z.string().min(1, 'Value is required'),
        }),
      )
      .optional(),
    context: z.nativeEnum(MetadataModelContext, {
      required_error: ErrorMessages.RequiredField,
    }),
    required: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If type is List, options must be provided and not empty
      if (data.type === MetadataModelType.List) {
        return data.options && data.options.length > 0;
      }
      return true;
    },
    {
      message: 'Options are required when type is List',
      path: ['options'],
    },
  );

export const updateMetadataModelValidator = z.object({
  name: z
    .string({
      required_error: ErrorMessages.RequiredField,
    })
    .min(1, ErrorMessages.RequiredField)
    .optional(),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1, 'Label is required'),
        value: z.string().min(1, 'Value is required'),
      }),
    )
    .optional(),
});

export type CreateMetadataModelPayload = z.infer<
  typeof createMetadataModelValidator
>;
export type UpdateMetadataModelPayload = z.infer<
  typeof updateMetadataModelValidator
>;
