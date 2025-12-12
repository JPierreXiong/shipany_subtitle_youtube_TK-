import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { user, referral, subscription } from '@/config/db/schema';
import { isValidCustomerId } from '@/shared/lib/customer-id';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Apply referral bonus when new user registers with referrer ID
 * POST /api/users/apply-referral
 * Body: { referrerCustomerId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.user) {
      return respErr('Unauthorized', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { referrerCustomerId } = body || {};

    if (!referrerCustomerId) {
      return respErr('Referrer customer ID is required');
    }

    if (!isValidCustomerId(referrerCustomerId)) {
      return respErr('Invalid referrer customer ID format');
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

    // Check if user already has a referrer
    if (currentUser.referrerId) {
      return respErr('User already has a referrer');
    }

    // Find referrer by customer ID
    const [referrer] = await db()
      .select()
      .from(user)
      .where(eq(user.customerId, referrerCustomerId))
      .limit(1);

    if (!referrer) {
      return respErr('Referrer not found');
    }

    if (referrer.id === currentUser.id) {
      return respErr('Cannot refer yourself');
    }

    // Update current user with referrer
    await db()
      .update(user)
      .set({ referrerId: referrer.customerId })
      .where(eq(user.id, currentUser.id));

    // Create referral record
    const referralId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await db().insert(referral).values({
      id: referralId,
      referrerId: referrer.id,
      refereeId: currentUser.id,
      referrerCustomerId: referrer.customerId || '',
      refereeCustomerId: currentUser.customerId || '',
      rewardType: 'referral_bonus',
      rewardDays: 7, // 7 days bonus for both
      isPaidUser: false, // Will be updated when user pays
      applied: false,
    });

    // Apply 7 days bonus to new user
    const bonusDays = 7;
    let newExpiresAt = new Date();
    if (currentUser.subscriptionExpiresAt && currentUser.subscriptionExpiresAt > new Date()) {
      newExpiresAt = new Date(currentUser.subscriptionExpiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    } else {
      newExpiresAt.setDate(newExpiresAt.getDate() + bonusDays);
    }

    await db()
      .update(user)
      .set({ subscriptionExpiresAt: newExpiresAt })
      .where(eq(user.id, currentUser.id));

    // Apply 7 days bonus to referrer
    let referrerExpiresAt = new Date();
    if (referrer.subscriptionExpiresAt && referrer.subscriptionExpiresAt > new Date()) {
      referrerExpiresAt = new Date(referrer.subscriptionExpiresAt);
      referrerExpiresAt.setDate(referrerExpiresAt.getDate() + bonusDays);
    } else {
      referrerExpiresAt.setDate(referrerExpiresAt.getDate() + bonusDays);
    }

    await db()
      .update(user)
      .set({ subscriptionExpiresAt: referrerExpiresAt })
      .where(eq(user.id, referrer.id));

    // Mark referral as applied
    await db()
      .update(referral)
      .set({ applied: true, appliedAt: new Date() })
      .where(eq(referral.id, referralId));

    return respData({
      success: true,
      message: 'Referral bonus applied',
      bonusDays: 7,
    });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to apply referral');
  }
}


