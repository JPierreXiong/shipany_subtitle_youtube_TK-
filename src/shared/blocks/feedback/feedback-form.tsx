'use client';

import { useState } from 'react';
import { Send, Loader2, Mail, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';

export function FeedbackForm() {
  const t = useTranslations('feedback');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error(t('invalid_email'));
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error(t('message_too_short'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });

      const data = await res.json();
      if (data.code === 0) {
        toast.success(t('submit_success'));
        setEmail('');
        setMessage('');
      } else {
        toast.error(data.message || t('submit_error'));
      }
    } catch (error: any) {
      toast.error(t('submit_error'));
      console.error('Feedback submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="text-primary" size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription className="mt-1">
              {t('description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={16} />
              {t('email_label')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('message_label')}</Label>
            <Textarea
              id="message"
              placeholder={t('message_placeholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              disabled={loading}
              className="resize-none"
              required
            />
            <p className="text-sm text-muted-foreground">
              {t('message_hint')}
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !message.trim() || message.trim().length < 10}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>{t('submitting')}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{t('submit_button')}</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


