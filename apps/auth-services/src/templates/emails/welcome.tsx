import { Button, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailBaseTemplate, {
  anchorStyle,
  buttonStyle,
  paragraphStyle,
} from './email-base-template';

export default function Welcome() {
  return (
    <EmailBaseTemplate title="Welcome">
      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>TBD</Text>
    </EmailBaseTemplate>
  );
}
