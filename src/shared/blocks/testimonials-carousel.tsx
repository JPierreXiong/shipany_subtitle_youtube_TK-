'use client';

import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Testimonial {
  id: string;
  userName: string;
  customerId?: string | null;
  content: string;
  createdAt: string;
}

export function TestimonialsCarousel() {
  const t = useTranslations('blog');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials/list?limit=10')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0) {
          setTestimonials(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || testimonials.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <h3 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          {t('testimonials.title')}
        </h3>
        <div className="relative overflow-hidden">
          {/* Scrolling container */}
          <div 
            className="flex gap-6"
            style={{
              animation: 'scroll 30s linear infinite',
              width: 'max-content'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running';
            }}
          >
            {/* Duplicate items for seamless loop */}
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div
                key={`${testimonial.id}-${idx}`}
                className="flex-shrink-0 w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
                style={{ minWidth: '320px' }}
              >
                <Quote className="mb-3 text-blue-500" size={24} />
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                  {testimonial.content}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {testimonial.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {testimonial.userName}
                    </p>
                    {testimonial.customerId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {testimonial.customerId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

