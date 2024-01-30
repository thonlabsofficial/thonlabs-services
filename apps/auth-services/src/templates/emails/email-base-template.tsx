import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  title: React.ReactNode;
  children?: React.ReactNode;
  signature?: React.ReactNode;
  preview?: string;
}

export function EmailBaseTemplate({ title, children }: Props) {
  return (
    <Tailwind>
      <Html>
        <Head />
        {'<% if (preview) { %>'}
        <div
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {'<%= preview %>'}
        </div>
        {'<% } %>'}
        <Body
          style={{
            backgroundColor: '#fff',
            fontFamily:
              '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
          }}
        >
          <Container
            style={{
              margin: '0 auto 16px',
            }}
          >
            <Section style={{ textAlign: 'center' }}>
              <Heading
                style={{
                  marginBottom: '20px',
                  fontSize: '24px',
                  marginTop: '16px',
                  color: '#18181B',
                }}
              >
                thon-labs
              </Heading>
            </Section>

            <Heading
              as="h2"
              style={{ marginTop: 0, marginBottom: '20px', fontSize: '32px' }}
            >
              {title}
            </Heading>
            {children}
            <Text
              style={{
                ...paragraphStyle,
                fontWeight: 'bold',
                marginBottom: 0,
                marginTop: '20px',
                color: '#18181B',
              }}
            >
              Thon Labs Team
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default EmailBaseTemplate;

export const paragraphStyle = {
  marginTop: 0,
  marginBottom: '8px',
  color: '#3F3F46',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

export const buttonStyle = {
  backgroundColor: '#60A5FA',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
};

export const anchorStyle = {
  color: '#3B82F6',
  textDecoration: 'underline',
};
