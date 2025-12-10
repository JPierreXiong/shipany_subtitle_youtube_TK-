import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { callRapidApiForExtraction } from '@/lib/rapidapi';
import {
  makeSubtitlePath,
  makeVideoPath,
  saveBufferToBlob,
  saveTextToBlob,
} from '@/lib/storage';

/**
 * Kick off processing after payment success.
 * This runs synchronous calls; for long-running work consider moving to a queue/cron.
 */
export async function startTaskProcessing(taskId: string) {
  const [t] = await db().select().from(task).where(eq(task.id, taskId));
  if (!t) {
    console.warn(`processor: task ${taskId} not found`);
    return;
  }
  if (t.status !== 'payment_pending') {
    // already handled or in progress
    return;
  }

  await db()
    .update(task)
    .set({ status: 'processing' })
    .where(eq(task.id, taskId));

  try {
    const apiResult = await callRapidApiForExtraction(
      t.url,
      t.platform as any,
      'en',
      'US'
    );
    if (!apiResult.success) {
      throw new Error(apiResult.errorMessage || 'rapidapi failed');
    }

    let transcriptText = apiResult.srtContent || '';
    let videoUrl = apiResult.videoContentUrl;

    if (videoUrl) {
      const videoRes = await fetch(videoUrl);
      if (videoRes.ok) {
        const arrBuf = await videoRes.arrayBuffer();
        const buf = Buffer.from(arrBuf);
        const storedVideoUrl = await saveBufferToBlob(
          makeVideoPath(taskId),
          buf,
          videoRes.headers.get('content-type') || 'video/mp4'
        );
        videoUrl = storedVideoUrl;
      }
    }

    const updates: Record<string, any> = {
      status: 'completed',
      updatedAt: new Date(),
    };

    if (transcriptText) {
      updates.originalSrtUrl = await saveTextToBlob(
        makeSubtitlePath(taskId),
        transcriptText,
        'text/plain'
      );
    }
    if (videoUrl) {
      updates.videoUrl = videoUrl;
    }

    await db().update(task).set(updates).where(eq(task.id, taskId));
  } catch (error: any) {
    await db()
      .update(task)
      .set({
        status: 'failed',
        error: error?.message || 'process failed',
        updatedAt: new Date(),
      })
      .where(eq(task.id, taskId));
  }
}

