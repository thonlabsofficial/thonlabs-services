import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariants } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function ConfirmEmail() {
  const href = `<%= environment.appURL %>/auth/confirm-email/<%= token %>`;

  return (
    <EmailBaseTemplate title="Confirm Your Email">
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        Hey{' '}
        {
          '<% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>'
        }
        ! 👋
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        We've received a request to sign up for{' '}
        {'<%= environment.project.appName %>'} using this email address. To
        complete the registration process, kindly confirm your email by clicking
        on the button below.
      </Text>

      <Link
        className={buttonVariants({
          variant: 'default',
        })}
        href={href}
      >
        Confirm Email
      </Link>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-4 mb-0',
        })}
      >
        In case of the button not works, you can confirm through the link:
      </Text>
      <Link
        href={href}
        className={textVariants({
          variant: 'link',
          className: 'text-sm',
        })}
      >
        {href}
      </Link>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-6 mb-5',
        })}
      >
        If you didn't initiate this sign-up request, please disregard this
        message or contact our security team{' '}
        <Link
          href="mailto:security@thonlabs.io"
          className={textVariants({
            variant: 'link',
          })}
        >
          security@thonlabs.io
        </Link>
        .
      </Text>
    </EmailBaseTemplate>
  );
}

export default ConfirmEmail;
