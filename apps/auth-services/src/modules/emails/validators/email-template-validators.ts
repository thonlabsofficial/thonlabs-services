import z from 'zod';

export const updateTemplateValidator = z.object({
  name: z.string({ required_error: 'Name is required' }),
  subject: z.string({ required_error: 'Subject is required' }),
  fromName: z.string({ required_error: 'From name is required' }),
  fromEmail: z.string({ required_error: 'From email is required' }),
  content: z.string({ required_error: 'Content is required' }),
  preview: z.string().optional().nullable(),
  replyTo: z.string({ required_error: 'Reply to is required' }),
});

export type UpdateTemplatePayload = z.infer<typeof updateTemplateValidator>;

export const updateTemplateEnabledStatusValidator = z.object({
  enabled: z.boolean(),
});

export type UpdateTemplateEnabledStatusPayload = z.infer<
  typeof updateTemplateEnabledStatusValidator
>;
