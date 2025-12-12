import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { user, testimonial } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';
import { eq } from 'drizzle-orm';
import { getUuid } from '@/shared/lib/hash';

/**
 * Create testimonial (user sharing experience)
 * POST /api/testimonials/create
 * Body: { content: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.user) {
      return respErr('Unauthorized', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { content } = body || {};

    if (!content || content.trim().length < 10) {
      return respErr('Content must be at least 10 characters');
    }

    // Get current user
    const [currentUser] = await db()
      .select()
      .from(user)
      .where(eq(user.id, auth.user.id))
      .limit(1);

    if (!currentUser) {
      return respErr('User not found');
    }

    // Check if user already shared (only once)
    const [existing] = await db()
      .select()
      .from(testimonial)
      .where(eq(testimonial.userId, currentUser.id))
      .limit(1);

    if (existing) {
      return respErr('You have already shared a testimonial');
    }

    // Create testimonial
    const testimonialId = getUuid();
    await db().insert(testimonial).values({
      id: testimonialId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      customerId: currentUser.customerId || null,
      content: content.trim(),
      status: 'approved', // Auto-approve for now
      approvedAt: new Date(),
    });

    // Apply 3 days bonus (same as share-testimonial API)
    const bonusDays = 3;
    let newExpiresAt = new Date();
    if (currentUser.subscriptionExpiresAt && currentUser.subscriptionExpiresAt > new Date()) {
      newExpiresAt = new Date(currentUser.subscriptionExpiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    } else {
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    }

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
      message: 'Testimonial created successfully',
      bonusDays: 3,
      hasFreePlan: hasFreePlan,
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to create testimonial');
  }
}


