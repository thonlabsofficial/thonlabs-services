import { SSOCreds } from '@/auth/modules/auth/interfaces/sso-creds';

export enum EnvironmentDataKeys {
  EnableSignUp = 'enableSignUp',
  Waitlist = 'waitlist',
  EmailTemplateDomain = 'emailTemplateDomain',
  SDKIntegrated = 'sdkIntegrated',
  EnableSignUpB2BOnly = 'enableSignUpB2BOnly',
  Styles = 'styles',
  Credentials = 'credentials',
}

export interface EnvironmentStyles {
  primaryColor: string;
}

export interface EnvironmentCredentials {
  google: SSOCreds;
}
