import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task, translation } from '@/config/db/schema';
import { makeSubtitlePath, saveTextToBlob } from '@/lib/storage';
import { translateSrtContent } from '@/lib/translate';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { taskId, targetLanguage } = body || {};

  if (!taskId) return respErr('taskId is required');
  if (!targetLanguage) return respErr('targetLanguage is required');

  try {
    const [t] = await db().select().from(task).where(eq(task.id, taskId));
    if (!t) return respErr('task not found');
    if (!t.originalSrtUrl) return respErr('task has no subtitle url');

    // fetch original srt content
    const res = await fetch(t.originalSrtUrl);
    if (!res.ok) {
      return respErr('failed to fetch original srt');
    }
    const srtContent = await res.text();

    // create translation row as processing
    const transId = getUuid();
    await db().insert(translation).values({
      id: transId,
      taskId,
      targetLanguage,
      status: 'processing',
    });

    // translate
    const translated = await translateSrtContent(srtContent, targetLanguage);

    // save translated srt to GCS
    const translatedUrl = await saveTextToBlob(
      makeSubtitlePath(taskId, targetLanguage),
      translated,
      'text/plain'
    );

    await db()
      .update(translation)
      .set({
        status: 'completed',
        translatedSrtUrl: translatedUrl,
        updatedAt: new Date(),
      })
      .where(eq(translation.id, transId));

    return respData({
      id: transId,
      translatedUrl,
    });
  } catch (error: any) {
    return respErr(error?.message || 'translate failed');
  }
}

