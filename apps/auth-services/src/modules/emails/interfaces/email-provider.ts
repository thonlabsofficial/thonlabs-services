export enum EmailProviderType {
  Resend = 'resend',
}

export enum EmailProviderStatus {
  Verifying = 'Verifying',
  Verified = 'Verified',
  Failed = 'Failed',
}

export interface EmailProvider {
  refId: string;
  domain: string;
  status: EmailProviderStatus;
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
