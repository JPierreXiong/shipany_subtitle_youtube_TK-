import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { testimonial } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';
import { eq, desc } from 'drizzle-orm';

/**
 * Get latest testimonials (for homepage carousel)
 * GET /api/testimonials/list?limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    try {
      const testimonials = await db()
        .select()
        .from(testimonial)
        .where(eq(testimonial.status, 'approved'))
        .orderBy(desc(testimonial.createdAt))
        .limit(limit);

      return respData(testimonials);
    } catch (dbError: any) {
      // If table doesn't exist or database error, return empty array instead of error
      console.error('Database error fetching testimonials:', dbError);
      return respData([]);
    }
  } catch (error: any) {
    console.error('API error:', error);
    // Return empty array instead of error to prevent page crash
    return respData([]);
  }
}


