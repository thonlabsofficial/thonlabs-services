import MagicLink from '@/auth/templates/emails/magic-link';
import ConfirmEmail from '@/auth/templates/emails/confirm-email';
import ForgotPassword from '@/auth/templates/emails/forgot-password';
import Welcome from '@/auth/templates/emails/welcome';
import { EmailTemplate, EmailTemplates } from '@prisma/client';
import { JSX } from 'react';

const emailTemplatesMapper: {
  [key in EmailTemplates]: Partial<Omit<EmailTemplate, 'content'>> & {
    content: JSX.Element;
  };
} = {
  [EmailTemplates.MagicLink]: {
    name: 'Magic Login',
    subject: 'Your login access link for <%= appName %>',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: MagicLink(),
  },
  [EmailTemplates.ConfirmEmail]: {
    name: 'Confirm Email',
    subject: 'Confirm your email for <%= appName %>',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: ConfirmEmail(),
  },
  [EmailTemplates.ForgotPassword]: {
    name: 'Forgot Password',
    subject: 'Create a new password on <%= appName %>',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: ForgotPassword(),
  },
  [EmailTemplates.Welcome]: {
    name: 'Welcome',
    subject: 'Welcome to <%= appName %>!',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: Welcome(),
  },
};

export default emailTemplatesMapper;
