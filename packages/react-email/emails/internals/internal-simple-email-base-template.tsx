import * as React from 'react';
import {
  Body,
  Head,
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

export function InternalSimpleEmailBaseTemplate({
  children,
  preview = undefined,
  farewell = '',
  signature = '',
}: Props) {
  return (
    <Tailwind
      // @ts-ignore - Tailwind config type mismatch with @react-email
      config={{
        theme: {
          extend: {
            fontFamily: {
              sans: 'Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            },
            colors: {
              primary: {
                DEFAULT: '#333333',
                foreground: '#ffffff',
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
          style={{
            fontFamily:
              'Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {children}
          <Section>
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
          <Section>
            <Row>
              <Column className="py-4">
                <div className="h-[1px] w-10 bg-zinc-300" />
              </Column>
            </Row>
          </Section>
          <Section>
            <Row>
              <Column className="mb-2 mt-1">
                <Link href="https://thonlabs.io">
                  <Img
                    src="https://thonlabs.io/thon-labs-logo-light.png"
                    alt="Thon Labs Logo"
                    className="w-[98px] h-[15px]"
                  />
                </Link>
              </Column>
            </Row>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default InternalSimpleEmailBaseTemplate;
