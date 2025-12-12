import { NextRequest } from 'next/server';

import { eq, and, gte, lte } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';
import { respErr } from '@/shared/lib/resp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = db().select().from(task);
    
    if (userId) {
      query = query.where(eq(task.userId, userId)) as any;
    }
    
    if (startDate || endDate) {
      const conditions: any[] = [];
      if (startDate) {
        conditions.push(gte(task.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(task.createdAt, new Date(endDate)));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    const tasks = await query;

    // Convert to CSV
    const headers = [
      'Task ID',
      'URL',
      'Platform',
      'Status',
      'Service Type',
      'Video Title',
      'Video Author',
      'Video Description',
      'Like Count',
      'View Count',
      'Share Count',
      'Comment Count',
      'Video Duration (seconds)',
      'Video Thumbnail',
      'Original SRT URL',
      'Video URL',
      'Created At',
      'Updated At',
    ];

    const rows = tasks.map((t) => [
      t.id,
      t.url,
      t.platform,
      t.status,
      t.serviceType || '',
      t.videoTitle || '',
      t.videoAuthor || '',
      t.videoDescription || '',
      t.likeCount || '',
      t.viewCount || '',
      t.shareCount || '',
      t.commentCount || '',
      t.videoDuration || '',
      t.videoThumbnail || '',
      t.originalSrtUrl || '',
      t.videoUrl || '',
      t.createdAt?.toISOString() || '',
      t.updatedAt?.toISOString() || '',
    ]);

    // Escape CSV values
    const escapeCsv = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="video-tasks-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return respErr(error?.message || 'Export failed');
  }
}

