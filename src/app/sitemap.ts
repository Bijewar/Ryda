import { env } from '@/lib/env';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/history`, lastModified: now, changeFrequency: 'daily', priority: 0.5 },
  ];
}
