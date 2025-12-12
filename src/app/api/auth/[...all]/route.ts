import { NextRequest, NextResponse } from 'next/server';

/**
 * Neon Auth API proxy route
 * This handles all authentication requests at /api/auth/* and proxies them to Neon Auth service
 * 
 * Neon Auth SDK expects routes like:
 * - /api/auth/get-session
 * - /api/auth/sign-up/email
 * - /api/auth/sign-in/email
 * etc.
 */

// Force dynamic rendering - this route uses headers and proxies to external service
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_URL;
    
    if (!neonAuthUrl) {
      console.error('NEXT_PUBLIC_NEON_AUTH_URL is not configured');
      return NextResponse.json(
        { error: 'Neon Auth URL is not configured' },
        { status: 500 }
      );
    }

    // Get the pathname from the catch-all route
    // e.g., /api/auth/get-session -> /get-session
    // e.g., /api/auth/sign-up/email -> /sign-up/email
    const pathname = request.nextUrl.pathname.replace('/api/auth', '');
    
    // Build the target URL
    const targetUrl = `${neonAuthUrl}${pathname}${request.nextUrl.search}`;
    
    // Forward the request to Neon Auth service
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase() !== 'host'
          )
        ),
      },
      body: await request.text(),
    });

    // Handle response
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || { error: 'Unexpected response format' };
    }
    
    // Forward response with status and headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        // Forward relevant headers from Neon Auth response
        ...Object.fromEntries(
          Array.from(response.headers.entries()).filter(([key]) => 
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error: any) {
    console.error('Neon Auth API proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication request failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_URL;
    
    if (!neonAuthUrl) {
      console.error('NEXT_PUBLIC_NEON_AUTH_URL is not configured');
      return NextResponse.json(
        { error: 'Neon Auth URL is not configured' },
        { status: 500 }
      );
    }

    // Get the pathname from the catch-all route
    const pathname = request.nextUrl.pathname.replace('/api/auth', '');
    
    // Build the target URL with query parameters
    const targetUrl = `${neonAuthUrl}${pathname}${request.nextUrl.search}`;
    
    // Forward the request to Neon Auth service
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase() !== 'host'
          )
        ),
      },
    });

    // Handle response
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || { error: 'Unexpected response format' };
    }
    
    // Forward response with status and headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        // Forward relevant headers from Neon Auth response
        ...Object.fromEntries(
          Array.from(response.headers.entries()).filter(([key]) => 
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error: any) {
    console.error('Neon Auth API proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication request failed' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods (PUT, DELETE, PATCH, etc.)
export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

// Generic handler for other HTTP methods
async function handleRequest(request: NextRequest, method: string) {
  try {
    const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_URL;
    
    if (!neonAuthUrl) {
      return NextResponse.json(
        { error: 'Neon Auth URL is not configured' },
        { status: 500 }
      );
    }

    const pathname = request.nextUrl.pathname.replace('/api/auth', '');
    const targetUrl = `${neonAuthUrl}${pathname}${request.nextUrl.search}`;
    
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase() !== 'host'
          )
        ),
      },
      body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined,
    });

    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || { error: 'Unexpected response format' };
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(
          Array.from(response.headers.entries()).filter(([key]) => 
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error: any) {
    console.error(`Neon Auth API proxy error (${method}):`, error);
    return NextResponse.json(
      { error: error.message || 'Authentication request failed' },
      { status: 500 }
    );
  }
}
