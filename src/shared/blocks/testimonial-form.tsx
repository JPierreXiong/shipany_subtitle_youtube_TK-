'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAppContext } from '@/shared/contexts/app';

export function TestimonialForm() {
  const t = useTranslations('blog');
  const { user } = useAppContext();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('testimonials.sign_in_required'));
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      toast.error('Please enter at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/testimonials/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (data.code === 0) {
        toast.success(t('testimonials.share_success'));
        setContent('');
      } else {
        toast.error(data.message || t('testimonials.share_error'));
      }
    } catch (error: any) {
      toast.error('Failed to submit testimonial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('testimonials.share_title')}</CardTitle>
        <CardDescription>
          {t('testimonials.share_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t('testimonials.share_placeholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          disabled={loading || !user}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {user ? t('testimonials.share_description') : t('testimonials.sign_in_required')}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading || !user || content.trim().length < 10}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>{t('testimonials.submitting')}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{t('testimonials.share_button')}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

