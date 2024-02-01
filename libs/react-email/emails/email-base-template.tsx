import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
  Img,
  Row,
  Column,
  Link,
} from '@react-email/components';

interface Props {
  title: React.ReactNode;
  children?: React.ReactNode;
}

export function EmailBaseTemplate({ title = 'Welcome', children }: Props) {
  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              primary: {
                DEFAULT: 'rgb(15, 23, 42)',
                foreground: 'rgb(248, 250, 252)',
              },
            },
          },
        },
      }}
    >
      <Html>
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
          {'<% if (preview) { %>'}
          {'<%= preview %>'}
          {'<% } %>'}
        </div>
        <Head />
        <Body
          className="bg-zinc-300 m-0 p-2.5"
          style={{
            fontFamily: 'sans-serif',
          }}
        >
          <Container className="max-w-[600px] mx-auto bg-white rounded shadow-lg">
            <Section>
              <Row>
                <Column className="text-center px-4 pt-6 pb-9">
                  <Link href="https://thonlabs.io">
                    <Img
                      src={`${process.env.NODE_ENV === 'production' ? 'https://thonlabs.io' : 'http://localhost:3101'}/thon-labs-logo-light.svg`}
                      alt="Thon Labs Logo"
                      className="w-[147px] h-[22px] mx-auto"
                    />
                  </Link>
                </Column>
              </Row>
            </Section>

            <Section className="px-7">
              <Heading as="h1" className="mt-0 mb-5 text-3xl text-zinc-800">
                {title}
              </Heading>
            </Section>

            <Section className="px-7">{children}</Section>

            <Section className="px-7 mt-3 mb-6">
              <Text className="font-bold text-zinc-800">
                {'<%= appName %>'} Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default EmailBaseTemplate;
