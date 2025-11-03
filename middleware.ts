import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const AUTH_WHITELIST = ['/api/auth/login', '/api/auth/signup'];

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Create response object
  const response = NextResponse.next();
  
  // Create the Supabase client for cookie-based session (reads from env vars automatically)
  const supabase = createMiddlewareClient({ 
    req, 
    res: response,
  });
  
  // Refresh the user's session - reads cookie from req and updates response
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if request is in auth whitelist
  if (AUTH_WHITELIST.includes(pathname)) {
    // Let whitelisted endpoints pass through without authentication
    return NextResponse.next();
  }
  
  // For non-whitelisted endpoints, check authentication
  // If cookie session is not found, check for Bearer token
  if (!session) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Validate the token using explicit credentials to ensure correct project
      const supabaseForToken = createClient<Database>(
        supabaseUrl,
        supabaseAnonKey
      );
      const { data: { user }, error } = await supabaseForToken.auth.getUser(token);
      if (error) {
        // Log the error for debugging
        console.error('Middleware token validation error:', error.message);
        console.error('Supabase URL:', supabaseUrl);
        console.error('Token issuer check - verify this matches the URL above');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (user) {
        // User is authenticated via token, proceed.
        return NextResponse.next();
      } else {
        // Invalid token
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // No cookie and no token
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // If authenticated (or on whitelist), proceed
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
