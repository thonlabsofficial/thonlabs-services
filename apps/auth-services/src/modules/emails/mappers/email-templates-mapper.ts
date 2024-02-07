import MagicLink from '@/emails/magic-link';
import ConfirmEmail from '@/emails/confirm-email';
import ForgotPassword from '@/emails/forgot-password';
import Welcome from '@/emails/welcome';
import { EmailTemplate, EmailTemplates } from '@prisma/client';
import { JSX } from 'react';

const emailTemplatesMapper: {
  [key in EmailTemplates]: Partial<Omit<EmailTemplate, 'content'>> & {
    content: JSX.Element;
  };
} = {
  [EmailTemplates.MagicLink]: {
    name: 'Magic Login',
    subject: 'Your Login Access Link For <%= appName %>',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: MagicLink(),
  },
  [EmailTemplates.ConfirmEmail]: {
    name: 'Confirm Email',
    subject: 'Confirm Your Email For <%= appName %>',
    fromName: 'Thon Labs',
    fromEmail: 'no-reply@thonlabs.io',
    content: ConfirmEmail(),
  },
  [EmailTemplates.ForgotPassword]: {
    name: 'Forgot Password',
    subject: 'Reset Your Account Password For <%= appName %>',
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
