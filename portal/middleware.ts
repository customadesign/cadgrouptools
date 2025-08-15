import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { customAlphabet } from 'nanoid';

// Generate request IDs
const generateRequestId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

// Security headers to prevent common attacks
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://lottie.host; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://lottie.host https://*.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: {
    auth: 5, // 5 auth attempts per minute
    api: 100, // 100 API requests per minute
    uploads: 10, // 10 uploads per minute
  },
};

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest, type: string): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return `${type}:${ip}`;
}

function checkRateLimit(request: NextRequest, type: keyof typeof rateLimitConfig.maxRequests): boolean {
  const key = getRateLimitKey(request, type);
  const now = Date.now();
  const limit = rateLimitConfig.maxRequests[type];

  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Generate and attach request ID
  const requestId = generateRequestId();
  response.headers.set('X-Request-ID', requestId);
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply rate limiting to sensitive endpoints
  const pathname = request.nextUrl.pathname;

  // Rate limit auth endpoints
  if (pathname.startsWith('/api/auth/') && !pathname.includes('/[...nextauth]')) {
    if (!checkRateLimit(request, 'auth')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Rate limit upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/presign')) {
    if (!checkRateLimit(request, 'uploads')) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Rate limit general API endpoints
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(request, 'api')) {
      return NextResponse.json(
        { error: 'Too many API requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Prevent access to sensitive files
  if (pathname.includes('/.env') || pathname.includes('/config') || pathname.includes('/.git')) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Clean up old rate limit entries periodically
  if (Math.random() < 0.01) { // 1% chance on each request
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime + 60000) { // Remove entries older than 1 minute past reset
        requestCounts.delete(key);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
