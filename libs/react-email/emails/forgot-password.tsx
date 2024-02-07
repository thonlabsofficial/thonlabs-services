import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariantsEmail } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function ForgotPassword() {
  const href = `<%= appURL %>/auth/reset-password/<%= token %>`;

  return (
    <EmailBaseTemplate title="Reset Your Account Password">
      <Text className={textVariants({ variant: 'paragraph' })}>
        Hey{' '}
        {
          '<% if (userFullName) { %> <%= userFullName %><% } else { %>there<% } %>'
        }
        ! 👋
      </Text>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mb-3' })}
      >
        We received a recent request to reset the password for your account. To
        proceed with the password reset, kindly click on the button provided
        below.
      </Text>

      <Link
        className={buttonVariantsEmail({
          variant: 'default',
        })}
        href={href}
      >
        Reset Password
      </Link>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mt-4' })}
      >
        In case of the button not works, you can reset the password through the
        link:
      </Text>

      <Link href={href} className="mt-0 mb-3 text-blue-500 text-sm">
        {href}
      </Link>

      <Text
        className={textVariants({ variant: 'paragraph', className: 'mb-5' })}
      >
        If you didn't initiate this reset password request, please disregard
        this message or contact our support team on{' '}
        <Link href={href} className="mt-0 mb-3 text-blue-500 text-sm">
          support@thonlabs.io
        </Link>
        .
      </Text>
    </EmailBaseTemplate>
  );
}

export default ForgotPassword;
