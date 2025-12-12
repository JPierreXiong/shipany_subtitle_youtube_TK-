import { redirect } from 'next/navigation';

import { envConfigs } from '@/config';
import { routing } from '@/core/i18n/config';
import { PaymentType } from '@/extensions/payment';
import { findOrderByOrderNo } from '@/shared/models/order';
import { getUserInfo } from '@/shared/models/user';
import {
  getPaymentService,
  handleCheckoutSuccess,
} from '@/shared/services/payment';

export async function GET(req: Request) {
  let redirectUrl = '';

  try {
    // get callback params
    const { searchParams, pathname } = new URL(req.url);
    const orderNo = searchParams.get('order_no');

    if (!orderNo) {
      throw new Error('invalid callback params');
    }

    // Extract locale from pathname (e.g., /en/api/payment/callback -> en)
    // or from referer header if available
    let locale = envConfigs.locale || 'en';
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && routing.locales.includes(pathParts[0] as any)) {
      locale = pathParts[0];
    } else {
      // Try to get locale from referer
      const referer = req.headers.get('referer');
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const refererParts = refererUrl.pathname.split('/').filter(Boolean);
          if (refererParts.length > 0 && routing.locales.includes(refererParts[0] as any)) {
            locale = refererParts[0];
          }
        } catch (e) {
          // Ignore referer parsing errors
        }
      }
    }

    // Build base URL with locale
    const baseUrl = locale === envConfigs.locale 
      ? envConfigs.app_url 
      : `${envConfigs.app_url}/${locale}`;

    // get sign user
    const user = await getUserInfo();
    if (!user || !user.email) {
      throw new Error('no auth, please sign in');
    }

    // get order
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      throw new Error('order not found');
    }

    // validate order and user
    if (!order.paymentSessionId || !order.paymentProvider) {
      throw new Error('invalid order');
    }

    if (order.userId !== user.id) {
      throw new Error('order and user not match');
    }

    const paymentService = await getPaymentService();

    const paymentProvider = paymentService.getProvider(order.paymentProvider);
    if (!paymentProvider) {
      throw new Error('payment provider not found');
    }

    // get payment session
    const session = await paymentProvider.getPaymentSession({
      sessionId: order.paymentSessionId,
    });

    // console.log('callback payment session', session);

    await handleCheckoutSuccess({
      order,
      session,
    });

    // Use callbackUrl from order if available, otherwise redirect to homepage
    if (order.callbackUrl) {
      redirectUrl = order.callbackUrl;
    } else {
      // Redirect to homepage after successful payment
      redirectUrl = baseUrl;
    }
  } catch (e: any) {
    console.error('checkout callback failed:', e);
    // On error, redirect to pricing page with locale
    const { pathname } = new URL(req.url);
    const pathParts = pathname.split('/').filter(Boolean);
    let locale = envConfigs.locale || 'en';
    if (pathParts.length > 0 && routing.locales.includes(pathParts[0] as any)) {
      locale = pathParts[0];
    }
    const baseUrl = locale === envConfigs.locale 
      ? envConfigs.app_url 
      : `${envConfigs.app_url}/${locale}`;
    redirectUrl = `${baseUrl}/pricing`;
  }

  redirect(redirectUrl);
}
