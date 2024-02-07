import { Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { textVariants } from '@/ui/components/text';

export function Welcome() {
  return (
    <EmailBaseTemplate title="Welcome To <%= appName %>">
      <Text className={textVariants({ variant: 'paragraph' })}>
        Hey{' '}
        {
          '<% if (userFullName) { %> <%= userFullName %><% } else { %>there<% } %>'
        }
        ! 👋
      </Text>
      <Text className={textVariants({ variant: 'paragraph' })}>
        We're thrilled to welcome you aboard. Thank you for choosing us as your
        partner.
      </Text>
      <Text className={textVariants({ variant: 'paragraph' })}>
        If you have any questions, feel free to reply to this email.
      </Text>
      <Text className={textVariants({ variant: 'paragraph' })}>Stay safe!</Text>
    </EmailBaseTemplate>
  );
}

export default Welcome;
