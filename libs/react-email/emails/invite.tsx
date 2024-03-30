import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariants } from '@/ui/components/button';
import { textVariants } from '@/ui/components/text';

export function Invite() {
  const href = `<%= appURL %>/auth/invite/<%= token %>`;

  return (
    <EmailBaseTemplate title="You're invited to join <%= appName %>!">
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
          className: 'mb-3 font-bold',
        })}
      >
        {'<%= inviter.fullName %>'} ({'<%= inviter.email %>'}) invited you to
        join the team.
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

      <Link
        className={buttonVariants({
          variant: 'default',
        })}
        href={href}
      >
        Accept Invitation
      </Link>
    </EmailBaseTemplate>
  );
}

export default Invite;
