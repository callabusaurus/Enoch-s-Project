import { NextResponse } from "next/server";
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const { chatId, title } = body || {};
  if (!chatId || !title || typeof title !== 'string' || title.trim() === '')
    return NextResponse.json({ error: 'chatId and title (non-empty string) required' }, { status: 400 });

  const { error } = await supabase
    .from('chats')
    .update({ title: title.trim() })
    .eq('user_id', userId)
    .eq('id', chatId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}


