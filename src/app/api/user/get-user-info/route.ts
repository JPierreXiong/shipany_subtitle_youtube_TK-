import { PERMISSIONS } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

export async function POST(req: Request) {
  try {
    // get sign user info
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    // check if user is admin (with error handling)
    let isAdmin = false;
    try {
      isAdmin = await hasPermission(user.id, PERMISSIONS.ADMIN_ACCESS);
    } catch (e) {
      console.log('check admin permission failed:', e);
      // Continue without admin check if it fails
    }

    // get remaining credits (with error handling)
    let remainingCredits = 0;
    try {
      remainingCredits = await getRemainingCredits(user.id);
    } catch (e) {
      console.log('get remaining credits failed:', e);
      // Continue with 0 credits if it fails
    }

    return respData({ ...user, isAdmin, credits: { remainingCredits } });
  } catch (e: any) {
    console.error('get user info failed:', e);
    return respErr(e?.message || 'get user info failed');
  }
}
