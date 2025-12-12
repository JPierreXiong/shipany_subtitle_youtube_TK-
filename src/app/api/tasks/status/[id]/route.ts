import { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { task, translation } from '@/config/db/schema';
import { respData, respErr } from '@/shared/lib/resp';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return respErr('id is required');

  const [t] = await db().select().from(task).where(eq(task.id, id));
  if (!t) return respErr('task not found');

  const translations = await db()
    .select()
    .from(translation)
    .where(eq(translation.taskId, id));

  return respData({
    task: t,
    translations,
  });
}

















