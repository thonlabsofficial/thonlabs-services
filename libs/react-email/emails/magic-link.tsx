import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariantsEmail } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function MagicLink() {
  const href = `<%= appURL %>/auth/magic/<%= token %>`;

  return (
    <EmailBaseTemplate title="Your Login Link">
      <Text className={textVariants({ variant: 'paragraph' })}>Hey there,</Text>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mb-3' })}
      >
        You can safely complete your login by clicking on button below.
      </Text>

      <Link
        className={buttonVariantsEmail({
          variant: 'default',
        })}
        href={href}
      >
        Complete Login
      </Link>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mt-4' })}
      >
        In case of the button not works, you can login through the link:
      </Text>

      <Link href={href} className="mt-0 mb-3 text-blue-500 text-sm">
        {href}
      </Link>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mb-5' })}
      >
        If you didn't initiate this login request, please disregard this message
        or contact our support team on{' '}
        <Link href={href} className="mt-0 mb-3 text-blue-500 text-sm">
          support@thonlabs.io
        </Link>
        .
      </Text>
    </EmailBaseTemplate>
  );
}

export default MagicLink;
