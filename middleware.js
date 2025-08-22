// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Refresh session if expired
  await supabase.auth.getSession();
  return response;
}

// Match all API routes (adjust if using App Router)
export const config = {
  matcher: ['/api/:path*'], // Protects all API routes
};