import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ThemeRegistry from '@/components/ThemeRegistry';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'LeadGenFlow AI - Lead Generation Platform',
  description: 'AI-powered lead generation and campaign management platform',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('decryption')) {
      throw error;
    }
  }

  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>
        <SessionProvider session={session}>
          <ThemeRegistry>{children}</ThemeRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
