import { NextRequest, NextResponse } from 'next/server';
import { serverAuthClient } from '@/core/auth/neon-server';

/**
 * Neon Auth API proxy route
 * This handles authentication requests and proxies them to Neon Auth
 */
export async function POST(request: NextRequest) {
  try {
    // Get the pathname from the catch-all route
    const pathname = request.nextUrl.pathname.replace('/api/auth/neon', '');
    
    // Forward the request to Neon Auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEON_AUTH_URL}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: await request.text(),
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error: any) {
    console.error('Neon Auth API error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname.replace('/api/auth/neon', '');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEON_AUTH_URL}${pathname}${request.nextUrl.search}`, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error: any) {
    console.error('Neon Auth API error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}


