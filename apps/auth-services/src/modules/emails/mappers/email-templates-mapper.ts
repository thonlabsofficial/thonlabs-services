import MagicLink from '@/emails/magic-link';
import ConfirmEmail from '@/emails/confirm-email';
import ForgotPassword from '@/emails/forgot-password';
import Welcome from '@/emails/welcome';
import Invite from '@/emails/invite';
import { EmailTemplate, EmailTemplates } from '@prisma/client';
import { JSX } from 'react';

const emailTemplatesMapper: {
  [key in EmailTemplates]: Partial<
    Omit<EmailTemplate, 'content' | 'fromName'>
  > & {
    content: JSX.Element;
  };
} = {
  [EmailTemplates.MagicLink]: {
    name: 'Magic Login',
    subject: 'Your Login Access Link For <%= appName %>',
    fromEmail: 'security',
    content: MagicLink(),
  },
  [EmailTemplates.ConfirmEmail]: {
    name: 'Confirm Email',
    subject: 'Confirm Your Email For <%= appName %>',
    fromEmail: 'security',
    content: ConfirmEmail(),
  },
  [EmailTemplates.ForgotPassword]: {
    name: 'Forgot Password',
    subject: 'Reset Your Account Password For <%= appName %>',
    fromEmail: 'security',
    content: ForgotPassword(),
  },
  [EmailTemplates.Welcome]: {
    name: 'Welcome',
    subject: 'Welcome to <%= appName %>!',
    fromEmail: 'hello',
    content: Welcome(),
  },
  [EmailTemplates.Invite]: {
    name: 'Invite User',
    subject: "You're invited to join <%= appName %>!",
    fromEmail: 'security',
    content: Invite(),
  },
};

export default emailTemplatesMapper;
