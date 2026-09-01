'use client';

import { env } from '@/lib/env';

/**
 * PostHog client (client-side). The `posthog-js` library is loaded dynamically
 * so the codebase compiles even if the package is missing in demo mode.
 */
let initialised = false;

export async function getPostHog(): Promise<typeof import('posthog-js')['default'] | null> {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (initialised) {
    return (await import('posthog-js')).default;
  }
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      loaded: () => {
        // posthog is ready
      },
    });
    initialised = true;
    return posthog;
  } catch {
    return null;
  }
}

/** Server-side PostHog client (used in API routes / workers). */
export async function getPostHogServer(): Promise<any> {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  try {
    const { PostHog } = await import('posthog-node');
    return new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, { host: env.NEXT_PUBLIC_POSTHOG_HOST });
  } catch {
    return null;
  }
}
