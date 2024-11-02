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
  farewell?: string;
  signature?: string;
}

export function InternalEmailBaseTemplate({
  title = '',
  children,
  preview = undefined,
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
          {preview}
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
          className="bg-zinc-100 m-0 pt-2.5 px-2.5 pb-8"
          style={{
            fontFamily: 'sans-serif',
          }}
        >
          <Section>
            <Row>
              <Column className="text-center py-6">
                <Link href="https://thonlabs.io">
                  <Img
                    src="https://thonlabs.io/thon-labs-logo-light.png"
                    alt="Thon Labs Logo"
                    className="w-[147px] h-[22px] mx-auto"
                  />
                </Link>
              </Column>
            </Row>
          </Section>

          <Container className="max-w-[600px] mx-auto bg-white rounded-[8px] pt-2.5">
            <Section className="px-2.5 mt-2">
              <Heading as="h1" className="mt-0 mb-2 text-2xl text-zinc-800">
                {title}
              </Heading>
            </Section>

            <Section className="px-2.5">{children}</Section>

            <Section className="px-2.5 mb-4">
              <Text className="mb-0 font-bold text-zinc-800">
                {farewell && (
                  <>
                    <span className="mb-0 text-zinc-800 font-normal">
                      {farewell}
                    </span>
                    <br />
                  </>
                )}
                {signature}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default InternalEmailBaseTemplate;
