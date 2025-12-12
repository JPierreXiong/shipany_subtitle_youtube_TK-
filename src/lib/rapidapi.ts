const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST_YOUTUBE = 'youtube-transcript-api.p.rapidapi.com';
const RAPIDAPI_HOST_TIKTOK = 'tiktok-download-video1.p.rapidapi.com';

export interface RapidApiResult {
  success: boolean;
  srtContent?: string;
  videoContentUrl?: string;
  errorMessage?: string;
  raw?: any;
  results?: any[];
  data?: any[];
  result?: any[];
  [key: string]: any;
  metadata?: {
    title?: string;
    author?: string;
    description?: string;
    likeCount?: number;
    viewCount?: number;
    shareCount?: number;
    commentCount?: number;
    duration?: number;
    thumbnail?: string;
    [key: string]: any;
  };
}

function assertRapidApiKey() {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not set');
  }
}

/**
 * Extract subtitles from YouTube video
 */
export async function fetchYouTubeSubtitles(
  videoId: string,
  lang = 'en'
): Promise<RapidApiResult> {
  assertRapidApiKey();
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST_YOUTUBE}/transcript?video_id=${videoId}&lang=${lang}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST_YOUTUBE,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        errorMessage: `YouTube API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    // Handle different response formats
    let transcriptData = data;
    if (Array.isArray(data)) {
      transcriptData = data;
    } else if (data.transcript || data.transcripts) {
      transcriptData = data.transcript || data.transcripts;
    } else if (data.data) {
      transcriptData = data.data;
    }
    
    // Convert transcript to SRT format
    const srtContent = convertToSrt(transcriptData);
    
    return {
      success: true,
      srtContent,
      raw: data,
      metadata: {
        title: data.title || data.videoTitle,
        author: data.author || data.channelName || data.channel,
        description: data.description || data.videoDescription,
        viewCount: data.viewCount || data.views,
        likeCount: data.likeCount || data.likes,
        duration: data.duration || data.lengthSeconds,
        thumbnail: data.thumbnail || data.thumbnails?.[0]?.url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error?.message || 'YouTube extraction failed',
    };
  }
}

/**
 * Extract subtitles from TikTok video
 */
export async function fetchTikTokSubtitles(
  url: string,
  region = 'US'
): Promise<RapidApiResult> {
  assertRapidApiKey();
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST_TIKTOK}/video?url=${encodeURIComponent(url)}&region=${region}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST_TIKTOK,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        errorMessage: `TikTok API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    // Extract subtitle if available
    let srtContent = '';
    if (data.subtitle || data.captions) {
      srtContent = convertToSrt(data.subtitle || data.captions);
    }
    
    return {
      success: true,
      srtContent: srtContent || undefined,
      videoContentUrl: data.video_url || data.videoUrl,
      raw: data,
      metadata: {
        title: data.title || data.description,
        author: data.author || data.username,
        description: data.description,
        likeCount: data.likeCount || data.likes,
        viewCount: data.viewCount || data.views,
        shareCount: data.shareCount || data.shares,
        commentCount: data.commentCount || data.comments,
        duration: data.duration,
        thumbnail: data.thumbnail || data.cover,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error?.message || 'TikTok extraction failed',
    };
  }
}

/**
 * Download TikTok video
 */
export async function fetchTikTokDownloadByUrl(
  url: string,
  region = 'US'
): Promise<RapidApiResult> {
  assertRapidApiKey();
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST_TIKTOK}/video?url=${encodeURIComponent(url)}&region=${region}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST_TIKTOK,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        errorMessage: `TikTok download error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      videoContentUrl: data.video_url || data.videoUrl || data.download_url,
      raw: data,
      metadata: {
        title: data.title || data.description,
        author: data.author || data.username,
        description: data.description,
        likeCount: data.likeCount || data.likes,
        viewCount: data.viewCount || data.views,
        shareCount: data.shareCount || data.shares,
        commentCount: data.commentCount || data.comments,
        duration: data.duration,
        thumbnail: data.thumbnail || data.cover,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error?.message || 'TikTok download failed',
    };
  }
}

/**
 * Main extraction function
 */
export async function callRapidApiForExtraction(
  input: string,
  platform: 'youtube' | 'tiktok' | 'tiktok-download',
  lang = 'en',
  region = 'US'
): Promise<RapidApiResult> {
  if (platform === 'youtube') {
    return fetchYouTubeSubtitles(input, lang);
  } else if (platform === 'tiktok-download') {
    return fetchTikTokDownloadByUrl(input, region);
  } else {
    return fetchTikTokSubtitles(input, region);
  }
}

/**
 * Convert transcript data to SRT format
 */
function convertToSrt(transcript: any): string {
  if (!transcript || !Array.isArray(transcript)) {
    return '';
  }

  let srt = '';
  let index = 1;

  for (const item of transcript) {
    const start = formatTime(item.start || item.startTime || 0);
    const end = formatTime(item.start + item.duration || item.end || item.endTime || 0);
    const text = item.text || item.content || '';

    srt += `${index}\n`;
    srt += `${start} --> ${end}\n`;
    srt += `${text}\n\n`;
    index++;
  }

  return srt;
}

/**
 * Format seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}
