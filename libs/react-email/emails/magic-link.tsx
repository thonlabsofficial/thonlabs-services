import { Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate from './email-base-template';
import { buttonVariantsEmail } from '@/ui/components/button';

export function MagicLink() {
  const href = `<%= appURL %>/auth/magic/<%= token %>`;

  return (
    <EmailBaseTemplate title="Your login link">
      <Text className="mt-0 mb-5 text-zinc-800 leading-relaxed">
        Hey there,
      </Text>

      <Text className="mt-0 mb-5 text-zinc-800 leading-relaxed">
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

      <Text className="mb-1 text-zinc-800 leading-relaxed mt-4">
        In case of the button not works, you can login through the link:
      </Text>

      <Link href={href} className="mt-0 mb-5 text-blue-500 text-sm">
        {href}
      </Link>
    </EmailBaseTemplate>
  );
}

export default MagicLink;
