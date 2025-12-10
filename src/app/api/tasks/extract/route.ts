import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { callRapidApiForExtraction } from '@/lib/rapidapi';
import {
  saveBufferToBlob,
  saveTextToBlob,
  makeSubtitlePath,
  makeVideoPath,
} from '@/lib/storage';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';

type Platform = 'youtube' | 'tiktok' | 'tiktok-download';

function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }
    if (u.searchParams.get('v')) {
      return u.searchParams.get('v');
    }
    if (u.pathname.startsWith('/embed/')) {
      return u.pathname.replace('/embed/', '');
    }
  } catch (e) {
    return null;
  }
  return null;
}

function toDataUri(text: string) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url, platform, lang = 'en', keywords, region = 'US' } = body || {};

  if (!url && platform !== 'tiktok-download') {
    return respErr('url is required');
  }
  if (!platform) {
    return respErr('platform is required');
  }

  const id = getUuid();
  await db().insert(task).values({
    id,
    url: url || keywords || '',
    platform,
    status: 'pending',
  });

  try {
    await db()
      .update(task)
      .set({ status: 'processing' })
      .where(eq(task.id, id));

    const apiResult = await callRapidApiForExtraction(
      platform === 'youtube' ? parseYouTubeVideoId(url) || url : url || keywords || '',
      platform as Platform,
      lang,
      region
    );
    const raw = apiResult.raw;
    if (!apiResult.success) {
      throw new Error(apiResult.errorMessage || 'extract failed');
    }
    let transcriptText = apiResult.srtContent || '';
    let videoUrl = apiResult.videoContentUrl;

    const updates: Record<string, any> = {
      status: 'completed',
      updatedAt: new Date(),
    };

    if (transcriptText) {
      const srtUrl = await saveTextToBlob(
        makeSubtitlePath(id),
        transcriptText,
        'text/plain'
      );
      updates.originalSrtUrl = srtUrl;
    }
    if (videoUrl) {
      // fetch and store to Blob for a stable URL
      const videoRes = await fetch(videoUrl);
      if (videoRes.ok) {
        const arrBuf = await videoRes.arrayBuffer();
        const buf = Buffer.from(arrBuf);
        const storedVideoUrl = await saveBufferToBlob(
          makeVideoPath(id),
          buf,
          videoRes.headers.get('content-type') || 'video/mp4'
        );
        updates.videoUrl = storedVideoUrl;
      } else {
        updates.videoUrl = videoUrl; // fallback to source url
      }
    }

    await db()
      .update(task)
      .set(updates)
      .where(eq(task.id, id));

    return respData({
      id,
      status: 'completed',
      transcript: transcriptText || undefined,
      videoUrl,
      raw,
    });
  } catch (error: any) {
    await db()
      .update(task)
      .set({
        status: 'failed',
        error: error?.message || 'extract failed',
        updatedAt: new Date(),
      })
      .where(eq(task.id, id));
    return respErr(error?.message || 'extract failed');
  }
}

