import z from 'zod';

export const updateTemplateValidator = z.object({
  name: z.string({ required_error: 'Template name is required' }),
  subject: z.string({ required_error: 'Template subject is required' }),
  fromName: z.string({ required_error: 'Template from name is required' }),
  fromEmail: z.string({ required_error: 'Template from email is required' }),
  content: z.string({ required_error: 'Template content is required' }),
  preview: z.string().optional().nullable(),
  replyTo: z.string().optional().nullable(),
});
