"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Download, FileText, Video, CheckCircle2, XCircle } from 'lucide-react';

type Platform = 'youtube' | 'tiktok' | 'tiktok-download';
type DownloadType = 'subtitle' | 'video';

const TRANSLATION_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文简体' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

interface TaskStatus {
  task: {
    id: string;
    status: string;
    originalSrtUrl?: string | null;
    videoUrl?: string | null;
    videoTitle?: string | null;
    videoAuthor?: string | null;
    likeCount?: number | null;
    viewCount?: number | null;
    shareCount?: number | null;
    commentCount?: number | null;
  };
  translations: {
    id: string;
    targetLanguage: string;
    status: string;
    translatedSrtUrl?: string | null;
  }[];
}

export default function SubtitleClient() {
  const t = useTranslations('subtitle');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [downloadType, setDownloadType] = useState<DownloadType>('subtitle');
  const [targetLang, setTargetLang] = useState('es');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [polling, setPolling] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showTranslationSelector, setShowTranslationSelector] = useState(false);

  // Auto-detect platform
  useEffect(() => {
    if (!url) return;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setPlatform('youtube');
      setDownloadType('subtitle');
    } else if (url.includes('tiktok.com')) {
      setPlatform('tiktok');
      setDownloadType('subtitle');
    }
  }, [url]);

  // Polling for task status with progress simulation
  useEffect(() => {
    if (!jobId) return;
    setPolling(true);
    setProgress(0);
    
    // Simulate progress (0-90% during processing)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 2;
        return prev;
      });
    }, 2000);

    const statusTimer = setInterval(() => {
      fetch(`/api/tasks/status/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 0) {
            setStatus(data.data);
            const st = data.data.task.status;
            if (st === 'completed') {
              clearInterval(statusTimer);
              clearInterval(progressInterval);
              setPolling(false);
              setProgress(100);
              setLoading(false);
              // Show translation selector if subtitle was extracted
              if (data.data.task.originalSrtUrl) {
                setShowTranslationSelector(true);
              }
            } else if (st === 'failed') {
              clearInterval(statusTimer);
              clearInterval(progressInterval);
              setPolling(false);
              setLoading(false);
              setError('Task failed. Please try again.');
            }
          } else {
            setError(data.message || 'Failed to get task status. Please try again.');
          }
        })
        .catch(() => {
          setError('Failed to check task status. Please try again.');
          clearInterval(statusTimer);
          clearInterval(progressInterval);
          setPolling(false);
          setLoading(false);
        });
    }, 3000);
    
    return () => {
      clearInterval(statusTimer);
      clearInterval(progressInterval);
    };
  }, [jobId]);

  // Polling for translation status
  useEffect(() => {
    if (!translateLoading || !jobId) return;
    setTranslateProgress(0);
    
    const progressInterval = setInterval(() => {
      setTranslateProgress((prev) => {
        if (prev < 90) return prev + 3;
        return prev;
      });
    }, 1000);

    const statusTimer = setInterval(() => {
      fetch(`/api/tasks/status/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 0) {
            setStatus(data.data);
            const translation = data.data.translations?.find(
              (t: any) => t.targetLanguage === targetLang
            );
            if (translation?.status === 'completed') {
              clearInterval(statusTimer);
              clearInterval(progressInterval);
              setTranslateProgress(100);
              setTranslateLoading(false);
            } else if (translation?.status === 'failed') {
              clearInterval(statusTimer);
              clearInterval(progressInterval);
              setTranslateLoading(false);
              setError('Translation failed. Please try again.');
            }
          }
        })
        .catch(() => {
          clearInterval(statusTimer);
          clearInterval(progressInterval);
          setTranslateLoading(false);
          setError('Failed to check translation status. Please try again.');
        });
    }, 2000);
    
    return () => {
      clearInterval(statusTimer);
      clearInterval(progressInterval);
    };
  }, [translateLoading, jobId, targetLang]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setJobId(null);
    setProgress(0);
    setShowTranslationSelector(false);
    
    try {
      // Determine platform based on download type
      const actualPlatform: Platform =
        downloadType === 'video' ? 'tiktok-download' : platform;

      if (downloadType === 'video' && !url.includes('tiktok.com')) {
        throw new Error('Video download is only available for TikTok videos.');
      }

      const res = await fetch('/api/tasks/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform: actualPlatform }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to extract subtitles. Server error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to extract subtitles. Please check your URL and try again.');
      }
      setJobId(data.data.id);
      setStatus({
        task: {
          id: data.data.id,
          status: 'processing',
          originalSrtUrl: undefined,
          videoUrl: undefined,
        },
        translations: [],
      });
    } catch (e: any) {
      const errorMessage = e?.message || 'Failed to extract subtitles. Please check your URL and try again.';
      setError(errorMessage);
      setLoading(false);
      console.error('Extract error:', e);
    }
  };

  const doTranslate = async () => {
    if (!jobId) return;
    setTranslateLoading(true);
    setTranslateProgress(0);
    setError(null);
    try {
      const res = await fetch('/api/tasks/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: jobId, targetLanguage: targetLang }),
      });
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message || 'Failed to translate subtitles. Please try again.');
    } catch (e: any) {
      setError(e.message);
      setTranslateLoading(false);
    }
  };

  const translations = useMemo(
    () => status?.translations ?? [],
    [status?.translations]
  );

  // Detect native language based on platform
  const nativeLanguage = platform === 'youtube' ? 'English' : 'Original';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Main Title */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          {t('title')}
        </h1>
        <h2 className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {t('subtitle')}
        </h2>
      </div>

      {/* Input Area */}
      <div className="space-y-6 rounded-lg border-2 border-gray-200 p-6 bg-white shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('inputLabel')}
          </label>
          <input
            className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('inputPlaceholder')}
            disabled={loading}
          />
        </div>

        {/* Three buttons row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Button 1: Native Language (disabled) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('nativeLanguageLabel')}
            </label>
            <div className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-100 text-gray-600 cursor-not-allowed flex items-center justify-center">
              <span>{nativeLanguage}</span>
            </div>
          </div>

          {/* Button 2: Translation Language */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('translationLanguageLabel')}
            </label>
            <select
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={loading || translateLoading}
            >
              {TRANSLATION_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Button 3: Download Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('downloadTypeLabel')}
            </label>
            <select
              className="border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value as DownloadType)}
              disabled={loading}
            >
              <option value="subtitle">{t('downloadTypeSubtitle')}</option>
              <option value="video" disabled={!url.includes('tiktok.com')}>
                {t('downloadTypeVideo')} {!url.includes('tiktok.com') && `(${t('tiktokOnly')})`}
              </option>
            </select>
          </div>
        </div>

        {/* Extract Button */}
        <button
          onClick={submit}
          disabled={loading || !url || (downloadType === 'video' && !url.includes('tiktok.com'))}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>{t('extracting')}</span>
            </>
          ) : (
            <>
              <FileText size={20} />
              <span>{t('extractButton')}</span>
            </>
          )}
        </button>

        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('processing')}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              This may take up to 3 minutes. Please wait...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Task Status and Results */}
      {jobId && status && (
        <div className="rounded-lg border-2 border-gray-200 p-6 bg-white shadow-sm space-y-4">
          {/* Task Info */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="text-sm text-gray-600">Task ID</p>
              <p className="font-mono text-sm text-gray-900">{jobId}</p>
            </div>
            <div className="text-sm">
              Status:{' '}
              <span className={`font-semibold capitalize ${
                status.task.status === 'completed' ? 'text-green-600' :
                status.task.status === 'failed' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {status.task.status}
              </span>
            </div>
          </div>

          {/* Video Metadata */}
          {status.task.videoTitle && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">{status.task.videoTitle}</h3>
              {status.task.videoAuthor && (
                <p className="text-sm text-gray-600">By: {status.task.videoAuthor}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {status.task.viewCount !== null && status.task.viewCount !== undefined && (
                  <span>👁️ {status.task.viewCount.toLocaleString()} views</span>
                )}
                {status.task.likeCount !== null && status.task.likeCount !== undefined && (
                  <span>❤️ {status.task.likeCount.toLocaleString()} likes</span>
                )}
                {status.task.shareCount !== null && status.task.shareCount !== undefined && (
                  <span>📤 {status.task.shareCount.toLocaleString()} shares</span>
                )}
                {status.task.commentCount !== null && status.task.commentCount !== undefined && (
                  <span>💬 {status.task.commentCount.toLocaleString()} comments</span>
                )}
              </div>
            </div>
          )}

          {/* Download Links */}
          {status.task.status === 'completed' && (
            <div className="space-y-3">
              {status.task.originalSrtUrl && (
                <a
                  href={status.task.originalSrtUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText className="text-blue-600" size={24} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{t('downloadOriginal')}</p>
                    <p className="text-sm text-gray-600">.srt file</p>
                  </div>
                  <Download className="text-blue-600" size={20} />
                </a>
              )}

              {status.task.videoUrl && (
                <a
                  href={status.task.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Video className="text-purple-600" size={24} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{t('downloadVideo')}</p>
                    <p className="text-sm text-gray-600">MP4 file</p>
                  </div>
                  <Download className="text-purple-600" size={20} />
                </a>
              )}

              {/* Translation Section */}
              {showTranslationSelector && status.task.originalSrtUrl && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <h3 className="font-semibold text-gray-900">Need Translation?</h3>
                  
                  {/* Translation Progress */}
                  {translateLoading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Translating to {TRANSLATION_LANGS.find(l => l.code === targetLang)?.name}...</span>
                        <span>{translateProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-600 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${translateProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Translation Selector */}
                  {!translateLoading && (
                    <div className="flex gap-2">
                      <select
                        className="border-2 border-gray-300 rounded-lg px-4 py-2 text-base flex-1 focus:outline-none focus:border-green-500"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                      >
                        {TRANSLATION_LANGS.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={doTranslate}
                        disabled={translateLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        {translateLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Translating...</span>
                          </>
                        ) : (
                          <>
                            <FileText size={16} />
                            <span>Get Translation</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Translation Results */}
                  {translations.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium text-gray-700">Translation Results:</p>
                      {translations.map((translation) => (
                        <div
                          key={translation.id}
                          className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={18} />
                            <span className="font-medium">
                              {TRANSLATION_LANGS.find((l) => l.code === translation.targetLanguage)?.name}
                            </span>
                            <span className="text-gray-500 text-sm capitalize">
                              ({translation.status})
                            </span>
                          </div>
                          {translation.translatedSrtUrl && (
                            <a
                              href={translation.translatedSrtUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Download size={16} />
                              <span>{t('download')}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
