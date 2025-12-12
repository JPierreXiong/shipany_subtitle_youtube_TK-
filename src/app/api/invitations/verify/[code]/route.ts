import { NextRequest } from 'next/server';

import { eq, and, gt } from 'drizzle-orm';

import { db } from '@/core/db';
import { invitation } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';

/**
 * 验证邀请码
 * GET /api/invitations/verify/[code]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return respErr('Invitation code is required');
    }

    // 查询邀请码
    const [inv] = await db()
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.code, code.toUpperCase()),
          eq(invitation.status, 'pending'),
          gt(invitation.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!inv) {
      return respErr('Invalid or expired invitation code', 404);
    }

    return respData({
      valid: true,
      code: inv.code,
      expiresAt: inv.expiresAt.toISOString(),
      inviteeEmail: inv.inviteeEmail,
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to verify invitation');
  }
}





