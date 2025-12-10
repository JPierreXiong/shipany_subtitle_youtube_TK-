import { NextRequest } from 'next/server';

import { fetchTikTokDownloadByUrl } from '@/lib/rapidapi';
import { makeVideoPath, saveBufferToBlob } from '@/lib/storage';
import { respData, respErr } from '@/shared/lib/resp';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url, region = 'US' } = body || {};

  if (!url) return respErr('url is required');

  try {
    const res = await fetchTikTokDownloadByUrl(url, region);
    const first =
      res?.results?.[0] ||
      res?.data?.[0] ||
      res?.[0] ||
      res?.result?.[0];
    const videoUrl =
      first?.play ||
      first?.play_url ||
      first?.video ||
      first?.download_url ||
      '';
    if (!videoUrl) return respErr('No video url returned from RapidAPI');

    // fetch video bytes then store to Blob for a stable URL
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) return respErr('download video failed');
    const arrBuf = await videoRes.arrayBuffer();
    const buf = Buffer.from(arrBuf);
    const storedUrl = await saveBufferToBlob(
      makeVideoPath(),
      buf,
      videoRes.headers.get('content-type') || 'video/mp4'
    );

    return respData({
      videoUrl: storedUrl,
      sourceUrl: videoUrl,
      raw: first,
    });
  } catch (error: any) {
    return respErr(error?.message || 'download failed');
  }
}


