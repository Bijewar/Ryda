import { getCurrentUser } from '@/lib/auth/session';
import { getSystemSettings, updateSystemSettings } from '@/server/services/system-settings';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/config — get current configurable thresholds
 */
export async function GET(): Promise<NextResponse> {
  const config = await getSystemSettings();
  return NextResponse.json(ok(config));
}

/**
 * POST /api/admin/config — update thresholds from admin panel
 */
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (user?.accountType !== 'ADMIN' && process.env.DEMO_MODE !== 'true') {
    return NextResponse.json(error('FORBIDDEN', 'Admin access required'), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    const updated = await updateSystemSettings(body);
    return NextResponse.json(ok(updated));
  } catch (err) {
    return NextResponse.json(
      error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update settings'),
      { status: 500 },
    );
  }
}
