import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ACP SOP Korea | Attorney-Client Privilege',
  description: 'Attorney-Client Privilege Standard Operating Procedures for Korea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
