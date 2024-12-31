import { z } from 'zod';
import { domain } from '@/auth/modules/shared/validators/custom-validators';

export const newOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'This field is required' })
    .min(1, { message: 'This field is required' }),
  domains: z
    .object({
      domain: domain(),
    })
    .array(),
});
export type NewOrganizationFormData = z.infer<typeof newOrganizationSchema>;

export const updateOrganizationLogoSchema = z.object({
  file: z.custom(
    (file: Express.Multer.File) => {
      if (!file) {
        return false;
      }

      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
      ];
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (file.mimetype === 'image/svg+xml') {
        const content = file.buffer.toString();

        const dangerous = [
          /script/i,
          /onclick/i,
          /onload/i,
          /onmouseover/i,
          /onerror/i,
          /fetch/i,
          /import/i,
          /eval/i,
          /javascript/i,
          /<!\[CDATA\[/i,
          /xlink:href/i,
          /data:/i,
          /foreignObject/i,
          /embed/i,
          /base64/i,
        ];

        if (dangerous.some((regex) => regex.test(content))) {
          return false;
        }
      }

      return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
    },
    {
      message:
        'Invalid file. Max size: 50MB. Allowed files: PNG, JPG, JPEG, WEBP or SVG',
    },
  ),
});
export type UpdateOrganizationLogoData = z.infer<
  typeof updateOrganizationLogoSchema
>;

export const updateOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'This field is required' })
    .min(1, { message: 'This field is required' }),
  domains: z
    .object({
      domain: domain(),
    })
    .array(),
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
