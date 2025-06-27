import { SSOSocialProvider } from '@/auth/modules/auth/interfaces/sso-creds';
import { EmailProviderType } from '@/auth/modules/emails/interfaces/email-provider';

export const ENVIRONMENT_SSO_CREDENTIAL_TYPES = [SSOSocialProvider.Google];

export const ENVIRONMENT_EMAIL_PROVIDER_TYPES = [EmailProviderType.Resend];
