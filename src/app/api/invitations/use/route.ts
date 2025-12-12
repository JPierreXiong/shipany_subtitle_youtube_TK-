import { NextRequest } from 'next/server';

import { eq, and, gt } from 'drizzle-orm';

import { db } from '@/core/db';
import { invitation } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';

/**
 * 使用邀请码（注册时调用）
 * POST /api/invitations/use
 * Body: { code: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return respErr('Unauthorized', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body || {};

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

    // 检查是否已经被使用
    if (inv.status === 'used') {
      return respErr('Invitation code has already been used', 400);
    }

    // 标记为已使用
    await db()
      .update(invitation)
      .set({
        status: 'used',
        usedAt: new Date(),
        usedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(invitation.id, inv.id));

    return respData({
      success: true,
      message: 'Invitation code used successfully',
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to use invitation');
  }
}


