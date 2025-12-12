import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { user, subscription, referral } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';
import { eq } from 'drizzle-orm';

/**
 * Creem Webhook Handler
 * Handles payment success events and updates user subscription
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Creem webhook event types: checkout.completed, subscription.created, etc.
    const { event, data } = body;

    if (event === 'checkout.completed' || event === 'payment.succeeded') {
      const { customer_email, product_id, amount, currency, metadata } = data || {};
      
      if (!customer_email || !product_id) {
        return respErr('Missing required fields');
      }

      // Find user by email
      const [foundUser] = await db()
        .select()
        .from(user)
        .where(eq(user.email, customer_email))
        .limit(1);

      if (!foundUser) {
        return respErr('User not found');
      }

      // Define product configurations
      const productConfigs: Record<string, { months: number; bonusMonths: number }> = {
        'prod_7c1FZHQeCCFczvNU5dYWEj': { months: 1, bonusMonths: 0 }, // $12.9 USD - 1 month
        'prod_1pM4Co56OhCMC7EkwMjVf': { months: 6, bonusMonths: 0 }, // $59.9 USD - 6 months
        'prod_55OLI8OQq1I048Jn8IPYuN': { months: 10, bonusMonths: 2 }, // $129.90 USD - Annual (10 months + 2 free)
        'prod_67wmwvV2gVSBnblWES0uuN': { months: 60, bonusMonths: 0 }, // $599 USD - 5 years
      };

      const config = productConfigs[product_id];
      if (!config) {
        return respErr('Unknown product ID');
      }

      // Calculate expiration date
      const totalMonths = config.months + config.bonusMonths;
      let expiresAt = new Date();
      
      // If user already has an active subscription, extend from current expiration
      if (foundUser.subscriptionExpiresAt && foundUser.subscriptionExpiresAt > new Date()) {
        expiresAt = new Date(foundUser.subscriptionExpiresAt);
      }
      
      expiresAt.setMonth(expiresAt.getMonth() + totalMonths);

      // Update user subscription expiration
      await db()
        .update(user)
        .set({ subscriptionExpiresAt: expiresAt })
        .where(eq(user.id, foundUser.id));

      // Create subscription record
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db().insert(subscription).values({
        id: subscriptionId,
        subscriptionNo: `SUB${Date.now()}`,
        userId: foundUser.id,
        userEmail: customer_email,
        status: 'active',
        paymentProvider: 'creem',
        subscriptionId: data.checkout_id || data.id || subscriptionId,
        productId: product_id,
        amount: amount || 0,
        currency: currency || 'usd',
        interval: 'month',
        intervalCount: config.months,
        expiresAt: expiresAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt,
        paymentProductId: product_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Check if this is a referral bonus (annual plan)
      if (product_id === 'prod_55OLI8OQq1I048Jn8IPYuN' && foundUser.referrerId) {
        // Find referrer
        const [referrer] = await db()
          .select()
          .from(user)
          .where(eq(user.customerId, foundUser.referrerId))
          .limit(1);

        if (referrer) {
          // Apply 2 months bonus to referrer
          let referrerExpiresAt = new Date();
          if (referrer.subscriptionExpiresAt && referrer.subscriptionExpiresAt > new Date()) {
            referrerExpiresAt = new Date(referrer.subscriptionExpiresAt);
          }
          referrerExpiresAt.setMonth(referrerExpiresAt.getMonth() + 2);

          await db()
            .update(user)
            .set({ subscriptionExpiresAt: referrerExpiresAt })
            .where(eq(user.id, referrer.id));

          // Update referral record
          await db()
            .update(referral)
            .set({
              isPaidUser: true,
              rewardDays: 60, // 2 months = 60 days
              applied: true,
              appliedAt: new Date(),
            })
            .where(
              eq(referral.refereeId, foundUser.id)
            );
        }
      }

      return respData({ success: true });
    }

    return respData({ success: true, message: 'Event not handled' });
  } catch (error: any) {
    console.error('Creem webhook error:', error);
    return respErr(error?.message || 'Webhook processing failed');
  }
}




