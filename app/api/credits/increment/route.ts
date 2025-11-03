import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;

  const { amount } = await req.json().catch(() => ({ amount: null }));
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive integer' }, { status: 400 });
  }

  // Fetch current credits
  const { data, error: getError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();
  if (getError) return NextResponse.json({ error: getError.message }, { status: 400 });
  let currentCredits = typeof data?.credits === 'number' ? data.credits : 15;

  const newCredits = currentCredits + amount;

  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: newCredits })
    .eq('id', userId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ credits: newCredits });
}





