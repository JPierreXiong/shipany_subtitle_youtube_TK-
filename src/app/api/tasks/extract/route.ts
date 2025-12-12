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
  try {
    const body = await req.json().catch(() => ({}));
    const { url, platform, lang = 'en', keywords, region = 'US' } = body || {};

    if (!url && platform !== 'tiktok-download') {
      return respErr('url is required');
    }
    if (!platform) {
      return respErr('platform is required');
    }

    const id = getUuid();
    
    // Insert task with minimal fields first
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
      const metadata = apiResult.metadata || {};

      const updates: Record<string, any> = {
        status: 'completed',
        updatedAt: new Date(),
      };

      // Only add metadata fields if they exist (to avoid database errors)
      if (metadata.title) updates.videoTitle = metadata.title;
      if (metadata.author) updates.videoAuthor = metadata.author;
      if (metadata.description) updates.videoDescription = metadata.description;
      if (metadata.likeCount !== undefined) updates.likeCount = metadata.likeCount;
      if (metadata.viewCount !== undefined) updates.viewCount = metadata.viewCount;
      if (metadata.shareCount !== undefined) updates.shareCount = metadata.shareCount;
      if (metadata.commentCount !== undefined) updates.commentCount = metadata.commentCount;
      if (metadata.duration !== undefined) updates.videoDuration = metadata.duration;
      if (metadata.thumbnail) updates.videoThumbnail = metadata.thumbnail;
      if (metadata && Object.keys(metadata).length > 0) {
        updates.videoMetadata = JSON.stringify(metadata);
      }

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

      // Try to update with all fields first
      try {
        await db()
          .update(task)
          .set(updates)
          .where(eq(task.id, id));
      } catch (dbError: any) {
        // If database fields don't exist, try updating without metadata fields
        console.warn('Database update failed, trying without metadata fields:', dbError?.message);
        const basicUpdates: Record<string, any> = {
          status: updates.status,
          updatedAt: updates.updatedAt,
        };
        if (updates.originalSrtUrl) basicUpdates.originalSrtUrl = updates.originalSrtUrl;
        if (updates.videoUrl) basicUpdates.videoUrl = updates.videoUrl;
        
        await db()
          .update(task)
          .set(basicUpdates)
          .where(eq(task.id, id));
      }

      return respData({
        id,
        status: 'completed',
        transcript: transcriptText || undefined,
        videoUrl,
        raw,
      });
    } catch (error: any) {
      console.error('Extract error:', error);
      await db()
        .update(task)
        .set({
          status: 'failed',
          error: error?.message || 'extract failed',
          updatedAt: new Date(),
        })
        .where(eq(task.id, id))
        .catch((dbError) => {
          console.error('Failed to update task status:', dbError);
        });
      return respErr(error?.message || 'extract failed');
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return respErr(error?.message || 'Internal server error');
  }
}

