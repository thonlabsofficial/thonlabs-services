import { Button, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate, {
  anchorStyle,
  buttonStyle,
  paragraphStyle,
} from './email-base-template';

export default function MagicLink() {
  const href = `<%= appURL %>/api/auth/magic/authenticate/<%= token %>`;

  return (
    <EmailBaseTemplate title="Your login link">
      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        Hey there,
      </Text>

      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        You can safely complete your login by clicking on button below.
      </Text>

      <Button style={{ ...buttonStyle, marginBottom: '32px' }} href={href}>
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
