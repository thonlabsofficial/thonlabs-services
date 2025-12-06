import { z } from 'zod';
import {
  domain,
  logoValidator,
} from '@/auth/modules/shared/validators/custom-validators';

export const newOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'This field is required' })
    .min(1, { message: 'This field is required' }),
  domains: z
    .object({
      domain: domain(),
    })
    .array(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type NewOrganizationFormData = z.infer<typeof newOrganizationSchema>;

export type UpdateOrganizationLogoData = z.infer<typeof logoValidator>;

export const updateOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'This field is required' })
    .min(1, { message: 'This field is required' }),
  domains: z
    .object({
      domain: domain(),
    })
    .array(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateOrganizationFormData = z.infer<
  typeof updateOrganizationSchema
>;

export const updateOrganizationStatusValidator = z.object({
  active: z.boolean({ required_error: 'This field is required' }),
});
export type UpdateOrganizationStatusData = z.infer<
  typeof updateOrganizationStatusValidator
>;
