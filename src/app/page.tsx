import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { NavBar } from '@/components/ryda/NavBar';
import { Hero } from '@/components/ryda/Hero';
import { BookingSection } from '@/components/ryda/BookingSection';
import { ServicesSection } from '@/components/ryda/ServicesSection';
import { StatsSection } from '@/components/ryda/StatsSection';
import { FeaturesSection } from '@/components/ryda/FeaturesSection';
import { DriversSection } from '@/components/ryda/DriversSection';
import { Testimonials } from '@/components/ryda/Testimonials';
import { AppDownloadCTA } from '@/components/ryda/AppDownloadCTA';
import { Footer } from '@/components/ryda/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  let user: {
    name?: string | null;
    email?: string | null;
    accountType?: string;
    driverId?: string | null;
  } | null = null;

  if (session?.user) {
    let dbName = session.user.name;
    try {
      if (session.user.id) {
        const dbUser = await db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        });
        if (dbUser?.name) dbName = dbUser.name;
      }
    } catch (_e) {
      // Offline fallback
    }

    user = {
      name: dbName || session.user.email?.split('@')[0] || 'User',
      email: session.user.email,
      accountType: (session.user as any).accountType,
      driverId: (session.user as any).driverId,
    };
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-ryda-accent/20 selection:text-ryda-accent-dim">
      <NavBar user={user} />
      <main>
        <Hero />
        <BookingSection />
        <ServicesSection />
        <StatsSection />
        <FeaturesSection />
        <DriversSection />
        <Testimonials />
        <AppDownloadCTA />
      </main>
      <Footer />
    </div>
  );
}
