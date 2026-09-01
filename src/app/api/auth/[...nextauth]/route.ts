import { GET, POST } from '@/lib/auth/config';

/**
 * NextAuth v5 catch-all route. The `handlers` object exported from
 * `@/lib/auth/config` provides `GET` and `POST` route handlers that Next.js
 * matches against the `/api/auth/[...nextauth]` segment.
 *
 * Auth.js calls these for sign-in, sign-out, callback, session, csrf, etc.
 */
export { GET, POST };
