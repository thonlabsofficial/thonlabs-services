export enum EmailDomainStatus {
  Verifying = 'Verifying',
  Verified = 'Verified',
  Failed = 'Failed',
}

export interface EmailDomain {
  refId: string;
  domain: string;
  status: EmailDomainStatus;
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
