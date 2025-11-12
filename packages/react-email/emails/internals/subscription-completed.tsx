import { Link, Text } from '@react-email/components';
import * as React from 'react';
import InternalEmailBaseTemplate from './internal-email-base-template';
import { textVariants, buttonVariants } from '@thonlabs-services/ui';

interface Props {
  user: {
    firstName: string;
  };
  tlAppURL: string;
  paymentMode: 'subscription' | 'payment';
}

export function SubscriptionCompleted({
  user = {
    firstName: 'Gus',
  },
  tlAppURL = 'https://app.thonlabs.io',
  paymentMode = 'payment',
}: Props) {
  return (
    <InternalEmailBaseTemplate
      title={"Welcome to ThonLabs Pro - Let's build something great!"}
      preview={`Your ${paymentMode} has been completed successfully.`}
      farewell="Best regards,"
      signature="Gus - Founder of ThonLabs"
    >
      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        {`Hey${user.firstName ? ` ${user.firstName}` : ' there!'} 👋`}
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        You've just unlocked a faster, simpler way to add authentication to your
        app — and we're excited to see what you're building.
      </Text>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mb-4',
        })}
      >
        Enjoy all the Pro features included to your{' '}
        {paymentMode === 'subscription' ? 'subscription' : 'lifetime purchase'}.
        They're ready for you right now.
      </Text>

      <Link
        className={buttonVariants({
          variant: 'default',
        })}
        href={`${tlAppURL}/projects`}
      >
        Access your projects
      </Link>

      <Text
        className={textVariants({
          variant: 'paragraphEmail',
          className: 'mt-7 mb-4 font-bold',
        })}
      >
        PS: Got feedback or ideas? Just hit reply to this email (yes, I read
        every message).
      </Text>
    </InternalEmailBaseTemplate>
  );
}

export default SubscriptionCompleted;
