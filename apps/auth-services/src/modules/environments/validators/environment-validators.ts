import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { AuthProviders } from '@prisma/client';
import z from 'zod';
import { colorPatterns } from '@/utils/validators/patterns';

export const createEnvironmentValidator = z.object({
  name: z
    .string({ required_error: ErrorMessages.RequiredField })
    .max(25, ErrorMessages.MaxLength),
  appURL: z.string({ required_error: ErrorMessages.RequiredField }).url(),
  projectId: z.string({ required_error: ErrorMessages.RequiredField }),
});

export const updateAuthSettingsValidator = z.object({
  tokenExpiration: z.string(),
  refreshTokenExpiration: z.string().optional().nullable(),
  authProvider: z.nativeEnum(AuthProviders),
  enableSignUp: z.boolean(),
  enableSignUpB2BOnly: z.boolean(),
  styles: z.object({
    primaryColor: z
      .string({ required_error: ErrorMessages.RequiredField })
      .refine(
        (color) =>
          colorPatterns.hexColor.test(color) ||
          colorPatterns.rgbColor.test(color),
        { message: ErrorMessages.InvalidColorFormat },
      ),
  }),
});

export type UpdateAuthSettingsValidator = z.infer<
  typeof updateAuthSettingsValidator
>;

export const updateGeneralSettingsValidator = z.object({
  name: z
    .string({ required_error: ErrorMessages.RequiredField })
    .max(25, ErrorMessages.MaxLength),
  appURL: z.string({ required_error: ErrorMessages.RequiredField }).url(),
});

export type UpdateGeneralSettingsValidator = z.infer<
  typeof updateGeneralSettingsValidator
>;

export const updateGeneralSettingsLogoValidator = z.object({
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
