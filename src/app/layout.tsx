import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ryda — Premium Ride-Hailing, Reimagined for India',
    template: '%s · Ryda',
  },
  description:
    'Book bikes, autos, and premium cabs in seconds. Real-time matching, transparent fares, and a calmer ride. India\'s most refined ride-hailing app.',
  keywords: [
    'Ryda',
    'Bhopal',
    'ride-hailing',
    'bike taxi',
    'auto rickshaw',
    'cab booking',
    'premium rides',
    'Next.js',
  ],
  authors: [{ name: 'Ryda' }],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'Ryda — Premium Ride-Hailing, Reimagined for India',
    description: 'Book bikes, autos, and premium cabs in seconds. Real-time matching, transparent fares, and a calmer ride.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Ryda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryda',
    description: 'Premium ride-hailing, reimagined for India.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${sora.variable} ${mono.variable} font-sans bg-background text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
