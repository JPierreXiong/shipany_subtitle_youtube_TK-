import { NextRequest, NextResponse } from 'next/server';

/**
 * Neon Auth API proxy route
 * This handles authentication requests and proxies them to Neon Auth
 */
export async function POST(request: NextRequest) {
  try {
    const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
    
    if (!neonAuthUrl) {
      return NextResponse.json(
        { error: 'Neon Auth URL is not configured' },
        { status: 500 }
      );
    }

    // Get the pathname from the catch-all route
    const pathname = request.nextUrl.pathname.replace('/api/auth/neon', '');
    
    // Forward the request to Neon Auth
    const response = await fetch(`${neonAuthUrl}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: await request.text(),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Unexpected response format' };
    }
    
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
    const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
    
    if (!neonAuthUrl) {
      return NextResponse.json(
        { error: 'Neon Auth URL is not configured' },
        { status: 500 }
      );
    }

    const pathname = request.nextUrl.pathname.replace('/api/auth/neon', '');
    
    const response = await fetch(`${neonAuthUrl}${pathname}${request.nextUrl.search}`, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Unexpected response format' };
    }
    
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


