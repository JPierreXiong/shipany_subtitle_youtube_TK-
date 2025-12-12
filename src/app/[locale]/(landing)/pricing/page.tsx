import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';
import {
  FAQ as FAQType,
  Testimonials as TestimonialsType,
} from '@/shared/types/blocks/landing';
import { Pricing as PricingType } from '@/shared/types/blocks/pricing';

export const generateMetadata = getMetadata({
  metadataKey: 'pricing.metadata',
  canonicalUrl: '/pricing',
});

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  try {
    const { locale } = await params;
    setRequestLocale(locale);

    // load landing data
    const tl = await getTranslations('landing');
    // loading pricing data
    const t = await getTranslations('pricing');

    // get current subscription
    let currentSubscription;
    try {
      const user = await getUserInfo();
      if (user) {
        currentSubscription = await getCurrentSubscription(user.id);
      }
    } catch (error) {
      console.log('getting current subscription failed:', error);
    }

    // load page component
    const Page = await getThemePage('pricing');

    // build sections
    let pricing: PricingType;
    let faq: FAQType;
    let testimonials: TestimonialsType;
    
    try {
      pricing = t.raw('pricing');
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      throw new Error('Failed to load pricing data');
    }
    
    try {
      faq = tl.raw('faq');
    } catch (error) {
      console.error('Failed to load FAQ data:', error);
      faq = { id: 'faq', title: '', items: [] };
    }
    
    try {
      testimonials = tl.raw('testimonials');
    } catch (error) {
      console.error('Failed to load testimonials data:', error);
      testimonials = { id: 'testimonials', title: '', items: [] };
    }

    return (
      <Page
        locale={locale}
        pricing={pricing}
        currentSubscription={currentSubscription}
        faq={faq}
        testimonials={testimonials}
      />
    );
  } catch (error: any) {
    console.error('Pricing page error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading pricing page</h1>
          <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}
