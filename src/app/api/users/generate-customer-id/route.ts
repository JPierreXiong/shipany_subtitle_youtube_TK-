import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { generateCustomerId } from '@/shared/lib/customer-id';
import { respData, respErr } from '@/shared/lib/resp';
import { getAuth } from '@/core/auth';
import { eq } from 'drizzle-orm';

/**
 * Generate and assign customer ID to user
 * POST /api/users/generate-customer-id
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return respErr('Unauthorized', 401);
    }

    // Check if user already has customer ID
    const [existingUser] = await db()
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (existingUser?.customerId) {
      return respData({ customerId: existingUser.customerId });
    }

    // Generate unique customer ID
    let customerId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      customerId = generateCustomerId();
      const [existing] = await db()
        .select()
        .from(user)
        .where(eq(user.customerId, customerId))
        .limit(1);
      
      if (!existing) {
        break; // Unique ID found
      }
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return respErr('Failed to generate unique customer ID');
    }

    // Update user with customer ID
    await db()
      .update(user)
      .set({ customerId })
      .where(eq(user.id, session.user.id));

    return respData({ customerId });
  } catch (error: any) {
    return respErr(error?.message || 'Failed to generate customer ID');
  }
}


