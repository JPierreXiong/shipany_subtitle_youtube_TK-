import { NextRequest } from 'next/server';

import { Checkout } from '@creem_io/nextjs';

const apiKey = process.env.CREEM_API_KEY || process.env.CREEM_SECRET_KEY || '';

/**
 * Creem Checkout proxy route.
 * Supports query/body overrides: productId, successUrl, referenceId, metadata (json string).
 */
export async function GET(req: NextRequest) {
  if (!apiKey) {
    return new Response('CREEM_API_KEY is not set', { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || undefined;
  const successUrl = searchParams.get('successUrl') || undefined;
  const referenceId = searchParams.get('referenceId') || undefined;
  const metadataRaw = searchParams.get('metadata');
  let metadata: Record<string, string> | undefined = undefined;
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch (e) {
      // ignore malformed metadata
    }
  }

  // Types in @creem_io/nextjs only list apiKey/testMode/defaultSuccessUrl,
  // but runtime accepts additional defaults. Cast to any to keep behavior.
  const handler = Checkout({
    apiKey,
    testMode: process.env.NODE_ENV !== 'production',
    defaultSuccessUrl: successUrl || '/success',
    defaultProductId: productId,
    defaultReferenceId: referenceId,
    defaultMetadata: metadata,
  } as any);

  return handler(req);
}

export async function POST(req: NextRequest) {
  // mirror GET behavior for convenience (e.g., body JSON)
  if (!apiKey) {
    return new Response('CREEM_API_KEY is not set', { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const {
    productId,
    successUrl,
    referenceId,
    metadata: metadataRaw,
  }: {
    productId?: string;
    successUrl?: string;
    referenceId?: string;
    metadata?: any;
  } = body || {};

  let metadata: Record<string, string> | undefined = undefined;
  if (metadataRaw) {
    if (typeof metadataRaw === 'string') {
      try {
        metadata = JSON.parse(metadataRaw);
      } catch (e) {
        metadata = undefined;
      }
    } else if (typeof metadataRaw === 'object') {
      metadata = metadataRaw;
    }
  }

  // See note above on casting to any to allow extra default fields.
  const handler = Checkout({
    apiKey,
    testMode: process.env.NODE_ENV !== 'production',
    defaultSuccessUrl: successUrl || '/success',
    defaultProductId: productId,
    defaultReferenceId: referenceId,
    defaultMetadata: metadata,
  } as any);

  return handler(req);
}




