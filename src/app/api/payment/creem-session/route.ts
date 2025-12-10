import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { creem } from '@/lib/creem';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';

type ServiceType = 'EXTRACT_SUBTITLE' | 'DOWNLOAD_VIDEO';

// Avoid build-time static optimization; always evaluate at request time.
export const dynamic = 'force-dynamic';

function getUserIdFromRequest(req: NextRequest): string | null {
  // TODO: integrate Shipany auth; for now, accept header or fallback
  const h = req.headers.get('x-user-id');
  if (h) return h;
  return 'demo-user';
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return respErr('unauthorized');

    const body = await req.json().catch(() => ({}));
    const { url, platform, serviceType } = body || {};

    if (!url) return respErr('url is required');
    if (!platform) return respErr('platform is required');
    if (!serviceType) return respErr('serviceType is required');

    let amountInCents = 0;
    let productName = 'Video service';
    if (serviceType === 'EXTRACT_SUBTITLE') {
      amountInCents = 150;
      productName = 'Subtitle extraction & translation';
    } else if (serviceType === 'DOWNLOAD_VIDEO') {
      amountInCents = 250;
      productName = 'Video download (no watermark)';
    } else {
      return respErr('invalid serviceType');
    }

    const taskId = getUuid();
    // create pending task
    await db().insert(task).values({
      id: taskId,
      userId,
      url,
      platform,
      serviceType,
      status: 'payment_pending',
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await creem.checkout.sessions.create({
      payment_method_types: ['card', 'wechat', 'alipay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: productName },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?task_id=${taskId}`,
      cancel_url: `${baseUrl}/cancel?task_id=${taskId}`,
      metadata: {
        taskId,
        userId,
        platform,
      },
    });

    await db()
      .update(task)
      .set({ creemSessionId: session.id })
      .where(eq(task.id, taskId));

    return respData({ url: session.url, taskId });
  } catch (error: any) {
    console.error('creem-session error', error);
    return respErr(error?.message || 'creem session failed');
  }
}




