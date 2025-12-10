import { NextRequest } from 'next/server';

import { constructEvent } from '@creem_io/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { startTaskProcessing } from '@/lib/tasks/processor';
import { respOk, respErr } from '@/shared/lib/resp';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const signature =
    req.headers.get('creem-signature') || req.headers.get('Creem-Signature');
  if (!signature) {
    return respErr('Missing Creem-Signature header');
  }
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    return respErr('CREEM_WEBHOOK_SECRET not set');
  }

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: any;
  try {
    event = constructEvent(rawBody, signature, secret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  try {
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const taskId = session.metadata?.taskId as string | undefined;
      if (taskId) {
        await db()
          .update(task)
          .set({ status: 'payment_pending', creemSessionId: session.id })
          .where(eq(task.id, taskId));
        // fire-and-forget
        startTaskProcessing(taskId);
      }
    }
  } catch (err) {
    console.error('Webhook handling error', err);
  }

  return respOk();
}

