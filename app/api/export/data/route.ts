import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;

  // Profile & settings
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', userId).single();
  // Chats
  const { data: chats } = await supabase
    .from('chats').select('*').eq('user_id', userId);
  // Messages
  const { data: messages } = await supabase
    .from('messages').select('*').eq('user_id', userId);
  // Files (metadata only)
  const { data: files } = await supabase
    .from('files').select('*').eq('user_id', userId);
  // Teachers
  const { data: teachers } = await supabase
    .from('custom_teachers').select('*').eq('user_id', userId);
  // Credit history (if table: credit_transactions or similar)
  let creditHistory: any[] = [];
  try {
    const res = await supabase
      .from('credit_transactions').select('*').eq('user_id', userId);
    if (res.data) creditHistory = res.data;
  } catch {}

  const exportData = {
    profile: profile || {},
    chats: chats || [],
    messages: messages || [],
    files: files || [],
    teachers: teachers || [],
    creditHistory: creditHistory || []
  };
  return NextResponse.json(exportData);
}





