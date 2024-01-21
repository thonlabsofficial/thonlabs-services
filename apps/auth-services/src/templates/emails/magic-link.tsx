import { Button, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate, {
  anchorStyle,
  buttonStyle,
  paragraphStyle,
} from './email-base-template';

interface Props {
  token: string;
}

export function MagicLink({ token }: Props) {
  const href = `${process.env.WEB_APP_DOMAIN}/api/auth/magic/authenticate?token=${token}`;

  return (
    <EmailBaseTemplate title="Your login link" preview="Hey! Ready to login?">
      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        Hey there,
      </Text>

      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        You can safely complete your login by clicking on button below.
      </Text>

      <Button
        pY={12}
        pX={24}
        style={{ ...buttonStyle, marginBottom: '32px' }}
        href={href}
      >
        Complete Login
      </Button>

      <Text style={paragraphStyle}>
        In case of the button not works, you can login through the link:
      </Text>

      <Link href={href} style={anchorStyle}>
        {href}
      </Link>
    </EmailBaseTemplate>
  );
}
