import { Button, Column, Row, Section, Text } from '@react-email/components';
import React from 'react';
import EmailBaseTemplate, {
  buttonStyle,
  paragraphStyle,
} from './email-base-template';
import { format } from 'date-fns';

interface Props {
  userName?: string;
  product: string;
  price: number;
  startedAt: Date;
  webAppDomain: string;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function SubscriptionActivated({
  userName,
  product,
  price,
  startedAt = new Date(),
  webAppDomain,
}: Props) {
  return (
    <EmailBaseTemplate
      preview="See more details about your order"
      title="Your subscription confirmation"
    >
      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        Hey {userName ? userName : 'there'},
      </Text>

      <Text style={{ ...paragraphStyle, marginBottom: '20px' }}>
        Congratulations for your purchase. We're really happy to have you!
      </Text>

      <Text style={paragraphStyle}>
        We already activate your {product} subscription, your order info is
        below.
      </Text>

      <Section className="rounded bg-zinc-100 p-3 mt-3">
        <Row className="mb-2">
          <Column className="w-28 font-bold text-sm">Price</Column>
          <Column className="text-sm text-left">
            {numberFormatter.format(price / 100)}
          </Column>
        </Row>
        <Row>
          <Column className="w-28 font-bold text-sm">Start Date</Column>
          <Column className="text-sm text-left">
            {format(startedAt, 'MM/dd/yyyy')}
          </Column>
        </Row>
      </Section>

      <Text style={paragraphStyle} className="mt-4">
        Now you can check out the features by accessing the web platform.
      </Text>

      <Button
        pY={12}
        pX={24}
        style={buttonStyle}
        className="my-3"
        href={`${webAppDomain}/dashboard`}
      >
        Access my dashboard
      </Button>
    </EmailBaseTemplate>
  );
}

export default SubscriptionActivated;
