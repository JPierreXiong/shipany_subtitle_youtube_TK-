# Subtitle TK

## Getting Started

Subtitle TK - Extract subtitles from YouTube and TikTok, translate to 12 languages, and download videos.

## Local Development (Docker + Postgres)

1. Copy `env.example` to `.env.development` (or `.env.local`) and fill values, especially `AUTH_SECRET` and `DATABASE_URL`.
2. Start the local Postgres container: `docker-compose up -d db`.
3. Install deps: `pnpm install`.
4. Apply the schema: `pnpm db:push`.
5. (Optional) Seed RBAC roles: `pnpm rbac:init`.
6. Run the app: `pnpm dev`.

## Features

- Extract subtitles from YouTube and TikTok videos
- Translate subtitles to 12 languages
- Download TikTok videos
- Export video metadata as CSV

## Feedback

submit your feedbacks on [Github Issues](https://github.com/JPierreXiong/shipany_subtitle_youtube_TK-/issues)

## LICENSE

[LICENSE](./LICENSE)
