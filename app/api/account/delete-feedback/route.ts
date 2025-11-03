import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, supabase } = auth as any;
    let body: any = {};
    try { body = await req.json(); } catch {}
    const { reason = '', advice = '' } = body || {};

    const { error } = await supabase
      .from('account_deletion_feedback')
      .insert({ user_id: user.id, reason, advice, user_email: user.email || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


