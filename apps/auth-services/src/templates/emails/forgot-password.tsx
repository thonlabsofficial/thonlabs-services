import { Button, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate, {
  anchorStyle,
  buttonStyle,
  paragraphStyle,
} from './email-base-template';

export default function ForgotPassword() {
  const href = `<%= appURL %>/auth/confirm-email`;

  return (
    <EmailBaseTemplate title="Forgot Password">
      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>TBD</Text>
    </EmailBaseTemplate>
  );
}
