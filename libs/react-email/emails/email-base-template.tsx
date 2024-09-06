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
  preview?: string;
  appName?: string;
  farewell?: string;
  signature?: string;
}

export function EmailBaseTemplate({
  title = '',
  children,
  preview = undefined,
  appName = '',
  farewell = '',
  signature = '',
}: Props) {
  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            fontFamily: {
              sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            },
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
          {preview !== null || preview !== undefined ? (
            preview
          ) : (
            <>
              {'<% if (preview) { %>'}
              {'<%= preview %>'}
              {'<% } %>'}
            </>
          )}
          <div
            style={{
              display: 'none',
              opacity: 0,
              overflow: 'hidden',
              height: 0,
              width: 0,
              maxHeight: 0,
              maxWidth: 0,
              fontSize: '1px',
              lineHeight: '1px',
            }}
          >
            &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            <wbr />
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
          </div>
        </div>
        <Head />
        <Body
          className="bg-zinc-100 m-0 p-2.5"
          style={{
            fontFamily: 'sans-serif',
          }}
        >
          <Section>
            <Row>
              <Column className="text-center py-6">
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

          <Container className="max-w-[600px] mx-auto bg-white rounded shadow-lg pt-6">
            <Section className="px-7">
              <Heading as="h1" className="mt-0 mb-2 text-2xl text-zinc-800">
                {title}
              </Heading>
            </Section>

            <Section className="px-7">{children}</Section>

            <Section className="px-7 mb-6">
              <Text className="mb-0 font-bold text-zinc-800">
                {farewell && (
                  <>
                    <span className="mb-0 text-zinc-800 font-normal">
                      {farewell}
                    </span>
                    <br />
                  </>
                )}
                {signature ? (
                  signature
                ) : (
                  <>{appName ? appName : '<%= appName %>'} Team</>
                )}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default EmailBaseTemplate;
