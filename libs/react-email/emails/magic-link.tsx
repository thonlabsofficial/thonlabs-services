import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariants } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function MagicLink() {
  const href = `<%= appURL %>/auth/magic/<%= token %>`;

  return (
    <EmailBaseTemplate title="Your Login Link">
      <Text className={textVariants({ variant: 'paragraphEmail' })}>
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
        You can safely complete your login by clicking on button below.
      </Text>

      <Link
        className={buttonVariants({
          variant: 'default',
        })}
        href={href}
      >
        Complete Login
      </Link>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-4 mb-0',
        })}
      >
        In case of the button not works, you can login through the link:
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
        If you didn't initiate this login request, please disregard this message
        or contact our security team on{' '}
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

export default MagicLink;
