import { EmailProviderType } from '@/auth/modules/emails/interfaces/email-template';

export const ENVIRONMENT_EMAIL_PROVIDER_TYPES = [EmailProviderType.Resend];

export enum InternalEmailFrom {
  Support = 'support',
  Founder = 'founder',
}

const appUrl =
  process.env.NODE_ENV === 'production'
    ? `https://app.thonlabs.io`
    : `http://localhost:3000`;

export const INTERNAL_EMAILS = {
  [InternalEmailFrom.Support]: {
    from: 'ThonLabs Support Team <support@thonlabs.io>',
    url: appUrl,
  },
  [InternalEmailFrom.Founder]: {
    from: 'Gus from ThonLabs <gus@thonlabs.io>',
    url: appUrl,
  },
};
