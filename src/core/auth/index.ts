import { NextRequest } from 'next/server';
import { getNeonSession, getNeonUser } from './neon-server';

/**
 * Get authentication session using Neon Auth
 * This replaces the old better-auth getAuth() function
 * 
 * Usage in API routes:
 * const session = await getAuth(req);
 * if (!session?.user) {
 *   return respErr('Unauthorized', 401);
 * }
 */
export async function getAuth(req?: NextRequest) {
  const session = await getNeonSession(
    req ? { headers: req.headers } : undefined
  );
  
  if (!session) {
    return { user: null, session: null };
  }
  
  // Extract user from session (handle different formats)
  const user = (session as any).user || (session as any).data?.user || (session as any).session?.user || null;
  
  return {
    user,
    session,
    // For backward compatibility with better-auth API
    api: {
      getSession: async ({ headers }: { headers: Headers | Record<string, string> }) => {
        const s = await getNeonSession({ headers });
        if (!s) return { user: null };
        const u = (s as any).user || (s as any).data?.user || (s as any).session?.user || null;
        return { user: u };
      },
    },
  };
}
