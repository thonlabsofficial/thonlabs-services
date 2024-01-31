import { Metadata } from 'next';
import './globals.scss';

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
      <body>{children}</body>
    </html>
  );
}
