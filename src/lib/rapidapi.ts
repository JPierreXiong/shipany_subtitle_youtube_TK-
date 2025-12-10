import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST_YOUTUBE =
  process.env.RAPIDAPI_HOST_YOUTUBE || 'youtube-transcriptor.p.rapidapi.com';
const RAPIDAPI_HOST_TIKTOK =
  process.env.RAPIDAPI_HOST_TIKTOK || 'tiktok-download-video1.p.rapidapi.com';

function assertKey() {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not set');
  }
}

export interface RapidApiResult {
  success: boolean;
  srtContent?: string;
  videoContentUrl?: string;
  errorMessage?: string;
  raw?: any;
}

export async function callRapidApiForExtraction(
  url: string,
  platform: 'youtube' | 'tiktok' | 'tiktok-download',
  lang = 'en',
  region = 'US'
): Promise<RapidApiResult> {
  assertKey();
  try {
    if (platform === 'youtube') {
      const endpoint = `https://${RAPIDAPI_HOST_YOUTUBE}/transcript?video_id=${encodeURIComponent(
        url
      )}&lang=${lang}`;
      const res = await axios.get(endpoint, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST_YOUTUBE,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });
      const data = res.data;
      const text =
        data?.subtitle_text ||
        data?.text ||
        data?.transcript ||
        data?.data ||
        JSON.stringify(data ?? {});
      return {
        success: true,
        srtContent: typeof text === 'string' ? text : JSON.stringify(text),
        raw: data,
      };
    }

    if (platform === 'tiktok') {
      // transcript API
      const host = 'tiktok-transcriptor-api3.p.rapidapi.com';
      const endpoint = `https://${host}/index.php`;
      const res = await axios.post(
        endpoint,
        { url },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': host,
            'x-rapidapi-key': RAPIDAPI_KEY,
          },
        }
      );
      const data = res.data;
      const text = data?.text || data?.transcript || data?.data || '';
      return {
        success: true,
        srtContent: typeof text === 'string' ? text : JSON.stringify(text),
        raw: data,
      };
    }

    // tiktok-download
    const endpoint = `https://${RAPIDAPI_HOST_TIKTOK}/photoSearch?keywords=${encodeURIComponent(
      url
    )}&region=${region}`;
    const res = await axios.get(endpoint, {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST_TIKTOK,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });
    const data = res.data;
    const first =
      data?.results?.[0] || data?.data?.[0] || data?.[0] || data?.result?.[0];
    const videoUrl =
      first?.play ||
      first?.play_url ||
      first?.video ||
      first?.download_url ||
      '';
    if (!videoUrl) {
      return { success: false, errorMessage: 'No video url returned from RapidAPI' };
    }
    return { success: true, videoContentUrl: videoUrl, raw: data };
  } catch (error: any) {
    const apiError = error?.response?.data?.message || error?.message || 'RapidAPI error';
    return { success: false, errorMessage: apiError };
  }
}

