import { redirect } from '@/core/i18n/navigation';

export default async function AiChatbotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to /chat which has the ChatGenerator component
  redirect({ href: '/chat', locale });
}
