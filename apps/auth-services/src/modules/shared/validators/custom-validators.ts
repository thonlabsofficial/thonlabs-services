import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { z } from 'zod';

export const domain = () =>
  z
    .string({ required_error: ErrorMessages.RequiredField })
    .regex(
      /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/,
      { message: ErrorMessages.InvalidDomainFormat },
    )
    .min(1, { message: ErrorMessages.RequiredField });

export const logoValidator = z.object({
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
