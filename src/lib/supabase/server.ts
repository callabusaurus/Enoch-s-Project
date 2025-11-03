import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This function creates a Supabase client that can read/write cookies
// for server-side operations (like in API routes).
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
};

// Helper function to get authenticated user from either Bearer token or cookies
export async function getAuthenticatedUser(req: Request) {
  // First, try to get Bearer token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    const { data: { user }, error } = await supabaseWithToken.auth.getUser(token);
    if (error) {
      console.error('Bearer token validation error:', error.message);
      // Fall through to cookie-based auth
    } else if (user) {
      return { user, supabase: supabaseWithToken as any };
    }
  }
  
  // Fallback to cookie-based authentication
  const supabase = createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Cookie session error:', error.message);
    return null;
  }
  if (!session?.user) {
    console.error('No session or user in session');
    return null;
  }
  return { user: session.user, supabase: supabase as any };
}

