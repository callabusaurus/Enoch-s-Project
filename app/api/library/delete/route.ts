import { NextResponse } from "next/server";
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function DELETE(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  const { searchParams } = new URL(req.url || '');
  const chatId = searchParams.get('chatId');
  
  if (!chatId)
    return NextResponse.json({ error: 'chatId query parameter required' }, { status: 400 });

  // Delete messages first (child table), then chat
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .eq('user_id', userId)
    .eq('chat_id', chatId);
  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 400 });

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('user_id', userId)
    .eq('id', chatId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ success: true });
}


