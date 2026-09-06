import { env } from '@/lib/env';
import { getToken } from 'next-auth/jwt';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Ryda v2 — Edge middleware with Strict Role Isolation.
 *
 * Rules:
 *   1. Admin (/admin/*) — ONLY accessible by bijewarmanas1@gmail.com (ADMIN).
 *   2. Driver (/driver-dashboard, /earnings) — ONLY accessible when logged in as a DRIVER.
 *   3. Driver Redirection — If a logged-in driver attempts to access passenger /dashboard,
 *      they are automatically routed to /driver-dashboard.
 *   4. Passenger — Allowed full access across the website (/, /dashboard, /rides/*, /history, /receipts/*),
 *      but blocked from /admin and /driver-dashboard.
 */

const PROTECTED_PATTERNS = [
  /^\/dashboard(\/.*)?$/,
  /^\/rides(\/.*)?$/,
  /^\/history(\/.*)?$/,
  /^\/receipts(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/driver-dashboard(\/.*)?$/,
  /^\/earnings(\/.*)?$/,
];

const ADMIN_PATTERN = /^\/admin(\/.*)?$/;
const DRIVER_PATTERN = /^\/(driver-dashboard|earnings)(\/.*)?$/;
const PASSENGER_PATTERN = /^\/dashboard(\/.*)?$/;

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;

  // Always allow public driver registration and public assets
  if (pathname === '/driver/register' || pathname.startsWith('/driver/register/')) {
    return applySecurityHeaders(NextResponse.next());
  }

  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(pathname));

  if (!isProtected) {
    return applySecurityHeaders(NextResponse.next());
  }

  const isSecure =
    req.nextUrl.protocol === 'https:' ||
    req.headers.get('x-forwarded-proto') === 'https' ||
    !!process.env.VERCEL ||
    process.env.NODE_ENV === 'production';

  // Try to get the JWT token — on Vercel (HTTPS) the cookie is prefixed
  // with __Secure-. We try the secure version first, then fall back to the
  // non-secure version (local dev).
  const secret = env.AUTH_SECRET ?? process.env.AUTH_SECRET;
  let token = await getToken({ req, secret, secureCookie: isSecure });
  if (!token) {
    token = await getToken({ req, secret, secureCookie: !isSecure });
  }

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const email = (token.email as string | undefined)?.toLowerCase();
  const accountType = token.accountType as 'PASSENGER' | 'ADMIN' | undefined;
  const driverId = token.driverId as string | undefined;

  // 1. ADMIN ROUTE ISOLATION: Strictly restricted ONLY to bijewarmanas1@gmail.com
  if (ADMIN_PATTERN.test(pathname)) {
    if (accountType !== 'ADMIN' || email !== 'bijewarmanas1@gmail.com') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = driverId ? '/driver-dashboard' : '/dashboard';
      redirectUrl.search = '';
      return applySecurityHeaders(NextResponse.redirect(redirectUrl));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. DRIVER ROUTE ISOLATION: Only accessible by drivers or admin
  if (DRIVER_PATTERN.test(pathname)) {
    if (!driverId && email !== 'bijewarmanas1@gmail.com') {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      dashboardUrl.search = '';
      return applySecurityHeaders(NextResponse.redirect(dashboardUrl));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 3. PASSENGER ROUTE: Redirect /dashboard to / since / is the full booking app
  if (PASSENGER_PATTERN.test(pathname)) {
    if (driverId && email !== 'bijewarmanas1@gmail.com') {
      const driverUrl = req.nextUrl.clone();
      driverUrl.pathname = '/driver-dashboard';
      driverUrl.search = '';
      return applySecurityHeaders(NextResponse.redirect(driverUrl));
    }
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(homeUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|geo|api/health).*)'],
};
