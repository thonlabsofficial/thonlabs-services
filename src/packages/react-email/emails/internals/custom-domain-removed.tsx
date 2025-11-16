import { Link, Text } from '@react-email/components';
import * as React from 'react';
import InternalEmailBaseTemplate from './internal-email-base-template';
import { textVariants } from '@/ui';
import { formatInTimeZone } from 'date-fns-tz';
import { Environment, Project } from '@prisma/client';

interface Props {
  environment: Partial<Environment>;
  project: Partial<Project>;
  userFirstName: string;
  tlAppURL: string;
  removedAt: Date;
}

export function CustomDomainRemoved({
  environment = {} as Environment,
  project = {} as Project,
  userFirstName = '',
  tlAppURL = '',
  removedAt = new Date(),
}: Props) {
  return (
    <InternalEmailBaseTemplate
      title="Custom Domain Removed"
      preview={`Updates about your custom domain "${environment.customDomain}".`}
      farewell="Best regards,"
      signature="ThonLabs Support Team"
    >
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        Hey {userFirstName ? userFirstName : ''},
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        The custom domain <strong>"{environment.customDomain}"</strong> has been
        removed. As a result, your environment is no longer accessible through
        this domain.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        If you would like to add a new custom domain, you can do so{' '}
        <Link
          className={textVariants({
            variant: 'link',
          })}
          href={`${tlAppURL}/settings`}
          target="_blank"
          rel="noopener noreferrer"
        >
          through the platform
        </Link>{' '}
        at any time.
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
        <strong>Environment:</strong> {environment.name} (EID: {environment.id})
      </Text>
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-0 mt-0',
        })}
      >
        <strong>Removed at:</strong>{' '}
        {formatInTimeZone(removedAt, 'UTC', "MM/dd/yyyy h:mma 'UTC'")}
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-6 mb-5',
        })}
      >
        If you didn't initiate the process to remove the domain, please
        disregard this message or contact our support team{' '}
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

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        If you have any further questions or need assistance, feel free to reach
        out.
      </Text>
    </InternalEmailBaseTemplate>
  );
}

export default CustomDomainRemoved;
