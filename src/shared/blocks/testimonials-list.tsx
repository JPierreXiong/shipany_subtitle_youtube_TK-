'use client';

import { useEffect, useState } from 'react';
import { Quote, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import moment from 'moment';

interface Testimonial {
  id: string;
  userName: string;
  customerId?: string | null;
  content: string;
  createdAt: string;
}

export function TestimonialsList({ limit = 20 }: { limit?: number }) {
  const t = useTranslations('blog');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/testimonials/list?limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0) {
          setTestimonials(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading testimonials...</div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {t('testimonials.no_testimonials')}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t('testimonials.title')}
      </h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="flex flex-col rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
          >
            <Quote className="mb-3 text-blue-500" size={24} />
            <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {testimonial.content}
            </p>
            <div className="mt-auto border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  {testimonial.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {testimonial.userName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {testimonial.customerId && (
                      <span>ID: {testimonial.customerId}</span>
                    )}
                    {testimonial.customerId && testimonial.createdAt && (
                      <span>•</span>
                    )}
                    {testimonial.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {moment(testimonial.createdAt).format('YYYY-MM-DD')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





