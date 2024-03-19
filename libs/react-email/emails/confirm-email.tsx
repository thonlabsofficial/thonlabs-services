import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariantsEmail } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function ConfirmEmail() {
  const href = `<%= appURL %>/auth/confirm-email/<%= token %>`;

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
          '<% if (userFirstName) { %> <%= userFirstName %><% } else { %>there<% } %>'
        }
        ! 👋
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        We've received a request to sign up for {'<%= appName %>'} using this
        email address. To complete the registration process, kindly confirm your
        email by clicking on the button below.
      </Text>

      <Link
        className={buttonVariantsEmail({
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
      <Link href={href} className="mt-0 text-blue-500 text-sm">
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
        <Link href={href} className="mt-0 mb-3 text-blue-500">
          security@thonlabs.io
        </Link>
        .
      </Text>
    </EmailBaseTemplate>
  );
}

export default ConfirmEmail;
