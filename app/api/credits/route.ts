import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

const INITIAL_CREDITS = 15;

export async function GET(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  // Fetch credits from users, fallback to INITIAL_CREDITS if not set
  const { data, error: getError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();
  if (getError) return NextResponse.json({ error: getError.message }, { status: 400 });
  const credits = typeof data?.credits === 'number' ? data.credits : INITIAL_CREDITS;
  return NextResponse.json({ credits });
}





