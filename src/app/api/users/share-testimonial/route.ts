import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';
import { eq } from 'drizzle-orm';

/**
 * Share testimonial and get 3 days bonus (one-time only)
 * POST /api/users/share-testimonial
 * Body: { testimonial: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return respErr('Unauthorized', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { testimonial } = body || {};

    if (!testimonial || testimonial.trim().length < 10) {
      return respErr('Testimonial must be at least 10 characters');
    }

    // Get current user
    const [currentUser] = await db()
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser) {
      return respErr('User not found');
    }

    // Check if user already shared testimonial
    if (currentUser.testimonialShared) {
      return respErr('You have already shared a testimonial');
    }

    // Apply 3 days bonus
    const bonusDays = 3;
    let newExpiresAt = new Date();
    if (currentUser.subscriptionExpiresAt && currentUser.subscriptionExpiresAt > new Date()) {
      newExpiresAt = new Date(currentUser.subscriptionExpiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    } else {
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    }

    // For free users, also give free plan
    const hasFreePlan = !currentUser.subscriptionExpiresAt || currentUser.subscriptionExpiresAt <= new Date();

    // Update user
    await db()
      .update(user)
      .set({
        subscriptionExpiresAt: newExpiresAt,
        testimonialShared: true,
        hasFreePlan: hasFreePlan || currentUser.hasFreePlan,
      })
      .where(eq(user.id, currentUser.id));

    return respData({
      success: true,
      message: 'Testimonial shared successfully',
      bonusDays: 3,
      hasFreePlan: hasFreePlan,
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to share testimonial');
  }
}


