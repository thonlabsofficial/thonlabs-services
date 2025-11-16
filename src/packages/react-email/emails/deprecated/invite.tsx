import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariants, textVariants } from '@/ui';

export function Invite() {
  const href = `<%= environment.appURL %>/auth/confirm-email/<%= token %>`;

  return (
    <EmailBaseTemplate title="You're invited to join <%= environment.project.appName %>!">
      <Text className={textVariants({ variant: 'paragraphEmail' })}>
        Hey{' '}
        {
          '<% if (user.firstName) { %> <%= user.firstName %><% } else { %>there<% } %>'
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
        {'<%= environment.project.appName %>'} is an all-in-one platform that
        establishes the foundation for any SaaS product, allowing founders and
        software engineers to focus on what truly matters: their own product
        development.
      </Text>

      <Link
        className={buttonVariants({
          variant: 'default',
        })}
        href={href}
      >
        Accept Invitation
      </Link>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-4 mb-0',
        })}
      >
        In case of the button not works, you can accept the invite through the
        link:
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
    </EmailBaseTemplate>
  );
}

export default Invite;
