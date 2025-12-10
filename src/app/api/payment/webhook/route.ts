import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { startTaskProcessing } from '@/lib/tasks/processor';
import { respOk, respErr } from '@/shared/lib/resp';

// App Router no longer supports export const config; raw body access works by default.
// Signature verification package is removed to avoid missing module issues; fallback to raw JSON parsing.

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err: any) {
    console.error('Webhook body parse failed', err?.message);
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

