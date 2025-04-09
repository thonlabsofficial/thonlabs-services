export enum SSOSocialProvider {
  GOOGLE = 'google',
}

export interface SSOCreds {
  clientId: string;
  secretKey: string;
  redirectURI: string;
  active: boolean;
}
