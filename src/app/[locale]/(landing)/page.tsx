import { setRequestLocale } from 'next-intl/server';

import SubtitleClient from './subtitle/subtitle-client';
import { TestimonialsCarousel } from '@/shared/blocks/testimonials-carousel';
import { TestimonialForm } from '@/shared/blocks/testimonial-form';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  try {
    const { locale } = await params;
    setRequestLocale(locale);
    
    return (
      <>
        <SubtitleClient />
        <div className="container mx-auto px-4 py-8">
          <TestimonialForm />
        </div>
        <TestimonialsCarousel />
      </>
    );
  } catch (error: any) {
    console.error('Landing page error:', error);
    // Return a simple error page instead of crashing
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading page</h1>
          <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
          <pre className="mt-4 text-left text-sm bg-gray-100 p-4 rounded max-w-2xl overflow-auto">
            {error?.stack || JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}
