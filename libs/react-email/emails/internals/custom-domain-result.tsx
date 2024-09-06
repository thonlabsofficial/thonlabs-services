import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from '../email-base-template';
import { textVariants } from '@/ui/components/text';
import { CustomDomainStatus, Environment, Project } from '@prisma/client';
import { format } from 'date-fns-tz';

interface Props {
  environment?: Partial<Environment>;
  project?: Partial<Project>;
  userFirstName: string;
  tlAppURL?: string;
}

export function CustomDomainResult({
  environment = {} as Environment,
  project = {} as Project,
  userFirstName = '',
  tlAppURL = '',
}: Props) {
  const validationSuccess =
    environment.customDomainStatus === CustomDomainStatus.Verified;

  return (
    <EmailBaseTemplate
      title={`${validationSuccess ? 'Custom Domain Successfully Verified' : 'Custom Domain Verification Failed'}`}
      preview={`We have an update about your custom domain "${environment.customDomain}".`}
      farewell="Best regards,"
      signature="ThonLabs Support Team"
    >
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        {`Hey${userFirstName ? ` ${userFirstName}` : ' there!'}${validationSuccess ? ' 👋' : ','}`}
      </Text>

      {validationSuccess && (
        <>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-3',
            })}
          >
            We are happy to inform you that your custom domain{' '}
            <strong>"{environment.customDomain}"</strong> has been successfully
            verified. Your environment authentication is now accessible through
            this domain, allowing you to take advantage of the platform features
            seamlessly.
          </Text>

          {/* TODO: add the link for docs here when exists */}

          <Text
            className={textVariants({
              variant: 'h4',
              className: 'mb-1',
            })}
          >
            Audit details
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Project:</strong> {project.appName} (PID: {project.id})
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Environment:</strong> {environment.name} (EID:{' '}
            {environment.id})
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Verification started at:</strong>{' '}
            {environment.customDomainStartValidationAt &&
              format(
                environment.customDomainStartValidationAt,
                "MM/dd/yyyy h:mma 'UTC'",
                {
                  timeZone: 'UTC',
                },
              )}
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Verification concluded at:</strong>{' '}
            {environment.customDomainLastValidationAt &&
              format(
                environment.customDomainLastValidationAt,
                "MM/dd/yyyy h:mma 'UTC'",
                {
                  timeZone: 'UTC',
                },
              )}
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
            We were unable to verify your custom domain{' '}
            <strong>"{environment.customDomain}"</strong>. This is often caused
            by an issue with your DNS configuration, particularly the CNAME
            record.
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
            <strong>Add a New Domain:</strong> If you'd prefer, you can also{' '}
            <Link
              className={textVariants({
                variant: 'link',
              })}
              href={`${tlAppURL}/settings`}
              target="_blank"
              rel="noopener noreferrer"
            >
              add a new custom domain
            </Link>{' '}
            for validation through the platform, and setting up this domain in
            your DNS provider settings.
          </Text>

          <Text
            className={textVariants({
              variant: 'h4',
              className: 'mb-1',
            })}
          >
            Audit details
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Project:</strong> {project.appName} (PID: {project.id})
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Environment:</strong> {environment.name} (EID:{' '}
            {environment.id})
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Verification started at:</strong>{' '}
            {environment.customDomainStartValidationAt &&
              format(
                environment.customDomainStartValidationAt,
                "MM/dd/yyyy h:mma 'UTC'",
                {
                  timeZone: 'UTC',
                },
              )}
          </Text>
          <Text
            className={textVariants({
              variant: 'paragraphEmail',
              className: 'mb-0 mt-0',
            })}
          >
            <strong>Verification failed at:</strong>{' '}
            {environment.customDomainLastValidationAt &&
              format(
                environment.customDomainLastValidationAt,
                "MM/dd/yyyy h:mma 'UTC'",
                {
                  timeZone: 'UTC',
                },
              )}
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
    </EmailBaseTemplate>
  );
}

export default CustomDomainResult;
