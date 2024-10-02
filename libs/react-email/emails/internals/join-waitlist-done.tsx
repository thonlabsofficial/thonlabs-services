import { Text } from '@react-email/components';
import * as React from 'react';
import InternalEmailBaseTemplate from './internal-email-base-template';
import { textVariants } from '@/ui/components/text';

interface Props {
  userFirstName: string;
}

export function JoinWaitlistDone({ userFirstName = '' }: Props) {
  return (
    <InternalEmailBaseTemplate
      title="You joined ThonLabs waitlist"
      preview="Thank you for joining the waitlist for ThonLabs!"
      farewell="Best regards,"
      signature="Gus"
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
        My name is Gus the founder of ThonLabs. Thank you for joining the
        waitlist for ThonLabs! 🎉 We're thrilled to have you onboard as we work
        towards building something amazing.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        ThonLabs is all about simplifying authentication for developers and
        businesses, providing secure and easy-to-integrate solutions that just
        work.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        While we prepare to launch, I'll be sharing updates with you so you can
        stay in the loop about our progress and new features. If you ever have
        any questions, ideas, or just want to chat, feel free to reach out to me
        directly in this email. I'm always open to feedback.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-3',
        })}
      >
        Thanks again for your trust, and I can't wait to show you what’s coming!
      </Text>
    </InternalEmailBaseTemplate>
  );
}

export default JoinWaitlistDone;
