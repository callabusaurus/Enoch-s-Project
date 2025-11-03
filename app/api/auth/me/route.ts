import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = session;
  // Return user data that matches Supabase User type
  // This allows the client to use this data directly
  return NextResponse.json({
    id: user.id,
    email: user.email,
    aud: user.aud,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    // Add more fields as needed, e.g., displayName, credits, settings.
  });
}





