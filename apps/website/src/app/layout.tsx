import { Metadata } from 'next';
import '@/ui/base.scss';
import '@/website/app/globals.scss';
import { Button } from '@/ui/components/button';

export const metadata: Metadata = {
  title: 'Thon Labs',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Button>Test</Button>
      </body>
    </html>
  );
}
