import type { Metadata } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ryda v2 — Production-grade ride-hailing for Bhopal',
    template: '%s · Ryda v2',
  },
  description:
    'Ryda v2 is a production-grade ride-hailing platform for Bhopal — Next.js 16 + Postgres/PostGIS + Socket.IO + Redis. Built as a freelance portfolio piece.',
  keywords: [
    'Ryda',
    'Bhopal',
    'ride-hailing',
    'Next.js',
    'Postgres',
    'PostGIS',
    'Socket.IO',
    'Redis',
    'Stripe',
    'Razorpay',
  ],
  authors: [{ name: 'Ryda v2' }],
  openGraph: {
    title: 'Ryda v2 — Production-grade ride-hailing for Bhopal',
    description: 'Built with Next.js 16 + Postgres/PostGIS + Socket.IO + Redis.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Ryda v2',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryda v2',
    description: 'Production-grade ride-hailing for Bhopal.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${mono.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
