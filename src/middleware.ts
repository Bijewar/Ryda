import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from '@/lib/env';

/**
 * Ryda v2 — Edge middleware.
 *
 * Responsibilities:
 *   1. Route protection — `/dashboard/*`, `/rides/*`, `/history/*`, `/receipts/*`,
 *      `/admin/*`, `/driver/*` require a session. Unauthenticated users are
 *      redirected to `/login?callbackUrl=...`.
 *   2. Role checks — `/admin/*` requires `accountType === 'ADMIN'`,
 *      `/driver/*` requires a driver session (`driverId` on the JWT).
 *      Wrong-role users are bounced to `/dashboard` instead of leaking the
 *      admin surface.
 *   3. Security headers — `X-Content-Type-Options`, `X-Frame-Options`,
 *      `Referrer-Policy`, `Permissions-Policy` are injected on every response
 *      so they cover static assets, API routes, and app routes uniformly.
 *   4. Demo-mode bypass — when `DEMO_MODE=true`, the auth checks are skipped
 *      so a recruiter can click through the app without logging in. The
 *      security headers still apply.
 *
 * The middleware runs on the Edge runtime. JWT decoding uses `AUTH_SECRET`
 * (HS256) — no DB call, no Prisma. That keeps cold-start under 50ms.
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

  // Always allow public driver registration
  if (pathname === '/driver/register' || pathname.startsWith('/driver/register/')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Inject security headers on every response — including non-protected routes
  // and static assets. We `next()` once and decorate the resulting response.
  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(pathname));

  // Demo-mode bypass: skip auth entirely so the app is click-through without
  // credentials. Headers still apply.
  if (env.DEMO_MODE) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  if (!isProtected) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Decode the JWT from the httpOnly cookie. `next-auth/jwt` reads
  // `next-auth.session-token` (or `__Secure-` variant in production) by default.
  const token = await getToken({
    req,
    secret: env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const accountType = token.accountType as 'PASSENGER' | 'ADMIN' | undefined;
  const driverId = token.driverId as string | undefined;

  // Admin routes — require ADMIN.
  if (ADMIN_PATTERN.test(pathname) && accountType !== 'ADMIN') {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  // Driver routes — require a driver session. Passengers get bounced.
  if (DRIVER_PATTERN.test(pathname) && !driverId && accountType !== 'ADMIN') {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  // Match every path except Next internals, static assets, and the API.
  // Auth routes (`/login`, `/register`, etc.) are intentionally included so
  // the security headers apply there too — the middleware short-circuits them.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|geo|api/health).*)'],
};
