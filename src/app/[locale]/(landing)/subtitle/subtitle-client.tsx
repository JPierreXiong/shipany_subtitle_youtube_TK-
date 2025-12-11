"use client";

import React, { useEffect, useMemo, useState } from 'react';

type Platform = 'youtube' | 'tiktok' | 'tiktok-download';

const LANGS = [
  'en',
  'zh-CN',
  'es',
  'fr',
  'de',
  'ja',
  'ko',
  'ru',
  'it',
  'pt',
  'ar',
  'hi',
];

interface TaskStatus {
  task: {
    id: string;
    status: string;
    originalSrtUrl?: string | null;
    videoUrl?: string | null;
  };
  translations: {
    id: string;
    targetLanguage: string;
    status: string;
    translatedSrtUrl?: string | null;
  }[];
}

export default function SubtitleClient() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [targetLang, setTargetLang] = useState('es');
  const [translateLoading, setTranslateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setPolling(true);
    const timer = setInterval(() => {
      fetch(`/api/tasks/status/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 0) {
            setStatus(data.data);
            const st = data.data.task.status;
            if (st === 'completed' || st === 'failed') {
              clearInterval(timer);
              setPolling(false);
            }
          } else {
            setError(data.message || 'status error');
          }
        })
        .catch(() => setError('status error'));
    }, 3000);
    return () => clearInterval(timer);
  }, [jobId]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setJobId(null);
    try {
      const res = await fetch('/api/tasks/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        throw new Error(data.message || 'extract failed');
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doTranslate = async () => {
    if (!jobId) return;
    setTranslateLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: jobId, targetLanguage: targetLang }),
      });
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message || 'translate failed');
      // refresh status
      const s = await fetch(`/api/tasks/status/${jobId}`).then((r) => r.json());
      if (s.code === 0) setStatus(s.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTranslateLoading(false);
    }
  };

  const translations = useMemo(
    () => status?.translations ?? [],
    [status?.translations]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">字幕提取与翻译</h1>
        <p className="text-sm text-gray-500">
          输入视频链接，选择平台，创建任务并下载字幕/视频。任务完成后可选择语言生成翻译字幕。
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">视频链接</label>
          <input
            className="border rounded px-3 py-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">平台</label>
          <select
            className="border rounded px-3 py-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok（字幕）</option>
            <option value="tiktok-download">TikTok（下载）</option>
          </select>
        </div>
        <button
          onClick={submit}
          disabled={loading || !url}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '提交中...' : '创建任务'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {jobId && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">任务 ID</p>
              <p className="font-mono text-sm">{jobId}</p>
            </div>
            <div className="text-sm">
              状态：{status?.task.status || 'pending'}
              {polling && <span className="text-gray-500">（轮询中）</span>}
            </div>
          </div>

          {status?.task.originalSrtUrl && (
            <div className="flex gap-2 items-center">
              <a
                className="text-blue-600 underline"
                href={status.task.originalSrtUrl}
                target="_blank"
              >
                下载原始字幕 (.srt)
              </a>
            </div>
          )}

          {status?.task.videoUrl && (
            <div className="flex gap-2 items-center">
              <a
                className="text-blue-600 underline"
                href={status.task.videoUrl}
                target="_blank"
              >
                下载视频
              </a>
            </div>
          )}

          {status?.task.status === 'completed' && (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  className="border rounded px-3 py-2"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {LANGS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  onClick={doTranslate}
                  disabled={translateLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {translateLoading ? '翻译中...' : '生成翻译字幕'}
                </button>
              </div>

              {translations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">翻译结果</p>
                  {translations.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 text-sm border rounded px-3 py-2"
                    >
                      <span>{t.targetLanguage}</span>
                      <span className="text-gray-500">{t.status}</span>
                      {t.translatedSrtUrl && (
                        <a
                          className="text-blue-600 underline"
                          href={t.translatedSrtUrl}
                          target="_blank"
                        >
                          下载字幕
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
  );
}













