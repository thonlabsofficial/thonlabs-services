export enum SSOSocialProvider {
  Google = 'google',
}

export interface SSOCreds {
  clientId: string;
  secretKey: string;
  redirectURI: string;
  active: boolean;
}
