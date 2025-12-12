import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { task } from '@/config/db/schema';

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;
export type UpdateTask = Partial<Omit<NewTask, 'id' | 'createdAt'>>;

export interface TaskStatistics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  downloadCount: number; // Number of completed tasks with downloadable files
  totalStorageMB: number; // Estimated total storage used in MB
}

/**
 * Get task statistics for a user
 */
export async function getTaskStatistics(
  userId: string
): Promise<TaskStatistics> {
  const [result] = await db()
    .select({
      total: count(),
      completed: sql<number>`COUNT(CASE WHEN ${task.status} = 'completed' THEN 1 END)`,
      failed: sql<number>`COUNT(CASE WHEN ${task.status} = 'failed' THEN 1 END)`,
      pending: sql<number>`COUNT(CASE WHEN ${task.status} = 'pending' THEN 1 END)`,
      processing: sql<number>`COUNT(CASE WHEN ${task.status} = 'processing' THEN 1 END)`,
      downloadCount: sql<number>`COUNT(CASE WHEN ${task.status} = 'completed' AND (${task.originalSrtUrl} IS NOT NULL OR ${task.videoUrl} IS NOT NULL) THEN 1 END)`,
    })
    .from(task)
    .where(eq(task.userId, userId));

  // Calculate estimated storage (rough estimate: 1MB per completed task)
  const completedCount = Number(result?.completed) || 0;
  const estimatedStorageMB = Math.round(completedCount * 1.5); // 1.5MB per completed task estimate

  return {
    total: result?.total || 0,
    completed: Number(result?.completed) || 0,
    failed: Number(result?.failed) || 0,
    pending: Number(result?.pending) || 0,
    processing: Number(result?.processing) || 0,
    downloadCount: Number(result?.downloadCount) || 0,
    totalStorageMB: estimatedStorageMB,
  };
}

/**
 * Get tasks for a user
 */
export async function getTasks({
  userId,
  status,
  platform,
  page = 1,
  limit = 20,
}: {
  userId?: string;
  status?: string;
  platform?: string;
  page?: number;
  limit?: number;
}): Promise<Task[]> {
  const result = await db()
    .select()
    .from(task)
    .where(
      and(
        userId ? eq(task.userId, userId) : undefined,
        status ? eq(task.status, status) : undefined,
        platform ? eq(task.platform, platform) : undefined
      )
    )
    .orderBy(desc(task.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return result;
}

/**
 * Get tasks count
 */
export async function getTasksCount({
  userId,
  status,
  platform,
}: {
  userId?: string;
  status?: string;
  platform?: string;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(task)
    .where(
      and(
        userId ? eq(task.userId, userId) : undefined,
        status ? eq(task.status, status) : undefined,
        platform ? eq(task.platform, platform) : undefined
      )
    );

  return result?.count || 0;
}

/**
 * Find task by id
 */
export async function findTaskById(id: string): Promise<Task | undefined> {
  const [result] = await db()
    .select()
    .from(task)
    .where(eq(task.id, id));

  return result;
}


