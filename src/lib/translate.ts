const GOOGLE_TRANSLATE_KEY = process.env.GOOGLE_TRANSLATE_KEY || '';

function assertTranslateKey() {
  if (!GOOGLE_TRANSLATE_KEY) {
    throw new Error('GOOGLE_TRANSLATE_KEY is not set');
  }
}

export async function translateTexts(
  texts: string[],
  target: string
): Promise<string[]> {
  assertTranslateKey();
  if (!texts.length) return [];

  // Google Translate v2 API
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      target,
      format: 'text',
    }),
  });

  if (!res.ok) {
    throw new Error(`translate failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const translations = data?.data?.translations || [];
  return translations.map((t: any) => t.translatedText || '');
}

export function parseSrt(srt: string) {
  const lines = srt.split(/\r?\n/);
  const blocks: { index: string; time: string; text: string[] }[] = [];
  let i = 0;
  while (i < lines.length) {
    const index = lines[i++].trim();
    if (!index) continue;
    const time = (lines[i++] || '').trim();
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }
    // skip empty line
    while (i < lines.length && lines[i].trim() === '') i++;
    blocks.push({ index, time, text: textLines });
  }
  return blocks;
}

export async function translateSrtContent(
  srtContent: string,
  target: string
): Promise<string> {
  const blocks = parseSrt(srtContent);
  const texts = blocks.map((b) => b.text.join('\n'));
  const translated = await translateTexts(texts, target);
  const rebuilt: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    rebuilt.push(blocks[i].index);
    rebuilt.push(blocks[i].time);
    rebuilt.push(translated[i] || '');
    rebuilt.push('');
  }
  return rebuilt.join('\n');
}


















