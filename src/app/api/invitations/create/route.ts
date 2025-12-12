import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { invitation } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';

/**
 * 创建邀请码
 * POST /api/invitations/create
 * Body: { inviteeEmail?: string, expiresInDays?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.user) {
      return respErr('Unauthorized', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { inviteeEmail, expiresInDays = 7 } = body || {};

    // 生成邀请码（8位随机字符串）
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // 创建邀请记录
    const id = getUuid();
    await db().insert(invitation).values({
      id,
      code,
      inviterId: auth.user.id,
      inviteeEmail: inviteeEmail || null,
      status: 'pending',
      expiresAt,
    });

    return respData({
      id,
      code,
      inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up?invite=${code}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to create invitation');
  }
}

