import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
// TODO: Fix creem integration - this route needs to use CreemProvider from extensions/payment
// import { creem } from '@/lib/creem';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';

// Force dynamic rendering - this route uses headers.get() which is dynamic
export const dynamic = 'force-dynamic';

type ServiceType = 'EXTRACT_SUBTITLE' | 'DOWNLOAD_VIDEO';

function getUserIdFromRequest(req: NextRequest): string | null {
  // TODO: integrate Subtitle TK auth; for now, accept header or fallback
  const h = req.headers.get('x-user-id');
  if (h) return h;
  return 'demo-user';
}

export async function POST(req: NextRequest) {
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

  try {
    // TODO: Implement proper Creem checkout session creation using CreemProvider
    // This requires product_id setup in Creem dashboard
    return respErr('creem session creation not implemented - please use standard checkout API');
    
    // Example implementation:
    // const paymentService = await getPaymentService();
    // const creemProvider = paymentService.getProvider('creem');
    // if (!creemProvider) {
    //   return respErr('creem provider not configured');
    // }
    // const result = await creemProvider.createPayment({ order: {...} });
  } catch (error: any) {
    return respErr(error?.message || 'creem session failed');
  }
}




