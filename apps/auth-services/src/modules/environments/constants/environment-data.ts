import {
  SSOCreds,
  SSOSocialProvider,
} from '@/auth/modules/auth/interfaces/sso-creds';
import { EmailProviderCredential } from '@/auth/modules/emails/interfaces/email-template';

export const ENVIRONMENT_SSO_CREDENTIAL_TYPES = [SSOSocialProvider.Google];

export enum EnvironmentDataKeys {
  EnableSignUp = 'enableSignUp',
  Waitlist = 'waitlist',
  EmailTemplateDomain = 'emailTemplateDomain',
  SDKIntegrated = 'sdkIntegrated',
  EnableSignUpB2BOnly = 'enableSignUpB2BOnly',
  Styles = 'styles',
  Credentials = 'credentials',
  ActiveSSOProviders = 'activeSSOProviders',
  EnvironmentLogo = 'environmentLogo'
}

export interface EnvironmentStyles {
  primaryColor: string;
}

export interface EnvironmentCredentials {
  google: SSOCreds;
  resend: EmailProviderCredential;
}
