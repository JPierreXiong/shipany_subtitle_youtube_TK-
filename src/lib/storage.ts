import { put } from '@vercel/blob';

import { getUuid } from '@/shared/lib/hash';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';

function assertBlob() {
  if (!BLOB_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
}

export async function saveTextToBlob(
  path: string,
  content: string,
  contentType = 'text/plain'
) {
  assertBlob();
  const res = await put(path, content, {
    access: 'public',
    contentType,
    token: BLOB_TOKEN,
  });
  return res.url;
}

export async function saveBufferToBlob(
  path: string,
  buf: Buffer,
  contentType = 'application/octet-stream'
) {
  assertBlob();
  const res = await put(path, buf, {
    access: 'public',
    contentType,
    token: BLOB_TOKEN,
  });
  return res.url;
}

export function makeSubtitlePath(id?: string, lang?: string) {
  const name = `${id || getUuid()}${lang ? `-${lang}` : ''}.srt`;
  return `subtitles/${name}`;
}

export function makeVideoPath(id?: string, ext = 'mp4') {
  const name = `${id || getUuid()}.${ext}`;
  return `videos/${name}`;
}

