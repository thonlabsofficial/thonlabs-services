import { Link, Text } from '@react-email/components';
import * as React from 'react';
import InternalEmailBaseTemplate from './internal-email-base-template';
import { textVariants } from '@thonlabs-services/ui';
import { Environment, Project } from '@prisma/client';

// Types duplicated from auth-services to avoid circular dependency
export enum EmailProviderDomainStatus {
  Verifying = 'Verifying',
  Verified = 'Verified',
  Failed = 'Failed',
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

interface Props {
  environment?: Partial<Environment>;
  project?: Partial<Project>;
  emailProvider?: EmailProvider;
  userFirstName: string;
  tlAppURL?: string;
}

export function EmailProviderResult({
  environment = {} as Environment,
  emailProvider = {} as EmailProvider,
  userFirstName = '',
  tlAppURL = '',
}: Props) {
  const validationSuccess =
    emailProvider.status === EmailProviderDomainStatus.Verified;

  return (
    <InternalEmailBaseTemplate
      title={`${validationSuccess ? 'Email Domain Successfully Verified' : 'Email Domain Verification Failed'}`}
      preview={`We have an update about your email domain "${emailProvider.domain}".`}
      farewell="Best regards,"
      signature="ThonLabs Support Team"
    >
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        {`Hey${userFirstName ? ` ${userFirstName}` : ''}${validationSuccess ? ' there! 👋' : ','}`}
      </Text>

      {validationSuccess && (
        <>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            We are happy to inform you that your email domain{' '}
            <strong>"{emailProvider.domain}"</strong> has been successfully
            verified. Your environment is able to send emails through this
            domain.
          </Text>

          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            If you have any further questions or need assistance, feel free to
            reach out.
          </Text>
        </>
      )}

      {!validationSuccess && (
        <>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            We were unable to verify your email domain{' '}
            <strong>"{emailProvider.domain}"</strong>. This is often caused by
            an issue with your DNS configuration. Please check the list of
            records described in ThonLabs{' '}
            <Link
              className={textVariants({
                variant: 'link',
              })}
              href={`${tlAppURL}/${environment.id}/domains`}
              target="_blank"
              rel="noopener noreferrer"
            >
              domains page
            </Link>{' '}
            and update your DNS provider settings.
          </Text>

          <Text
            className={textVariants({
              variant: 'h4',
              className: 'mb-1',
            })}
          >
            Some suggestions to resolve the issue
          </Text>

          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-2 mt-0',
            })}
          >
            <strong>Verify the CNAME Record:</strong> Ensure that the CNAME
            record for your domain is correctly pointing to our platform in your
            DNS provider settings.
          </Text>

          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-2',
            })}
          >
            <strong>Retry Verification:</strong> Once your DNS settings are
            updated, you can click "Verify Again" within the platform to retry
            the domain verification. We'll try to verify the domain again for
            the next 5 hours.
          </Text>

          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            <strong>Set a New Domain:</strong> If you'd prefer, you can also{' '}
            <Link
              className={textVariants({
                variant: 'link',
              })}
              href={`${tlAppURL}/${environment.id}/domains`}
              target="_blank"
              rel="noopener noreferrer"
            >
              set a new email domain
            </Link>{' '}
            for validation through the platform, and setting up this domain in
            your DNS provider settings.
          </Text>

          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            If you need assistance reviewing your DNS settings or with the
            verification process, our support team is here to help. You can
            reply this email or send a new one to{' '}
            <Link
              href="mailto:support@thonlabs.io"
              className={textVariants({
                variant: 'link',
              })}
            >
              support@thonlabs.io
            </Link>
            .
          </Text>
        </>
      )}
    </InternalEmailBaseTemplate>
  );
}

export default EmailProviderResult;
