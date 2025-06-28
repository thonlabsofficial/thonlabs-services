import { EmailTemplates, Environment, Project, User } from '@prisma/client';

export enum EmailProviderType {
  Resend = 'resend',
}

export enum EmailProviderDomainStatus {
  Verifying = 'Verifying',
  Verified = 'Verified',
  Failed = 'Failed',
}

export interface EmailProviderCredential {
  domain: string;
  secretKey: string;
  active: boolean;
}

export interface EmailProvider {
  refId: string;
  domain: string;
  status: EmailProviderDomainStatus;
  records: {
    record: string;
    name: string;
    type: string;
    ttl: string;
    status: string;
    value: string;
    priority: number;
  }[];
  region: string;
}

export interface SendEmailTemplateParams {
  to: string;
  emailTemplateType: EmailTemplates;
  environmentId: string;
  userId?: string;
  projectId?: string;
  data?: {
    token?: string;
    environment?: Partial<
      Environment & {
        authURL: string;
        appURLEncoded: string;
        project: Partial<Project>;
        emailDomain: string;
      }
    >;
    user?: Partial<User> & { firstName?: string };
    inviter?: Partial<User>;
    publicKey?: string;
    userFirstName?: string;
  };
  scheduledAt?: Date;
}

export interface EmailPayload {
  environmentId: string;
  emailTemplateType: EmailTemplates;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
  replyTo: string;
  scheduledAt?: Date;
}
