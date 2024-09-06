import { Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { textVariants } from '@/ui/components/text';

export function Welcome() {
  return (
    <EmailBaseTemplate
      title="Welcome to <%= appName %>"
      signature="Gus from ThonLabs"
      farewell="Best regards,"
    >
      <Text className={textVariants({ variant: 'paragraphEmail' })}>
        Hey{' '}
        {
          '<% if (userFirstName) { %> <%= userFirstName %><% } else { %>there<% } %>'
        }
        ! 👋
      </Text>

      <Text className={textVariants({ variant: 'paragraphEmail' })}>
        My name is Gustavo the founder of ThonLabs, but you can call me Gus. I'm
        thrilled to welcome you aboard. Thank you for choosing us as your
        partner.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
        })}
      >
        {'<%= appName %>'} is an all-in-one platform that establishes the
        foundation for any SaaS product, allowing founders and software
        engineers to focus on what truly matters: their own product development.
      </Text>

      <Text className={textVariants({ variant: 'paragraphEmail' })}>
        If you have any questions, feel free to reply to this email.
      </Text>
    </EmailBaseTemplate>
  );
}

export default Welcome;
