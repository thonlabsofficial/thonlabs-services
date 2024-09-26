import MagicLink from '@/emails/magic-link';
import ConfirmEmail from '@/emails/confirm-email';
import ForgotPassword from '@/emails/forgot-password';
import Welcome from '@/emails/welcome';
import Invite from '@/emails/invite';
import { EmailTemplate, EmailTemplates } from '@prisma/client';

const emailTemplatesMapper: {
  [key in EmailTemplates]: Partial<
    Omit<EmailTemplate, 'content' | 'fromName'>
  > & {
    content: any;
  };
} = {
  [EmailTemplates.MagicLink]: {
    name: 'Magic Login',
    subject: 'Your Login Access Link For <%= environment.project.appName %>',
    preview: 'Use the link to access the platform',
    fromEmail: 'security',
    content: MagicLink(),
  },
  [EmailTemplates.ConfirmEmail]: {
    name: 'Confirm Email',
    subject: 'Confirm Your Email For <%= environment.project.appName %>',
    preview: 'Use the link to confirm your email',
    fromEmail: 'security',
    content: ConfirmEmail(),
  },
  [EmailTemplates.ForgotPassword]: {
    name: 'Forgot Password',
    subject:
      'Reset Your Account Password For <%= environment.project.appName %>',
    preview: 'Use the link to reset your password',
    fromEmail: 'security',
    content: ForgotPassword(),
  },
  [EmailTemplates.Welcome]: {
    name: 'Welcome',
    subject: 'Welcome to <%= environment.project.appName %>!',
    preview: 'Some words from founder',
    fromEmail: 'hello',
    content: Welcome(),
  },
  [EmailTemplates.Invite]: {
    name: 'Invite User',
    subject: "You're invited to join <%= environment.project.appName %>!",
    preview: 'Use the link to join the platform',
    fromEmail: 'security',
    content: Invite(),
  },
};

export default emailTemplatesMapper;
