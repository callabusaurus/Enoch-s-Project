import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  const { searchParams } = new URL(req.url || '');
  const query = (searchParams.get('query') || '').trim();
  if (!query) return NextResponse.json([]);
  // Search chats by title ILIKE
  const { data: chats, error } = await supabase
    .from('chats')
    .select('id, title, is_favorite, created_at')
    .eq('user_id', userId)
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Format as /list endpoint
  const response = [];
  for (const chat of chats || []) {
    let lastMsg = '';
    let lastMsgTime = chat.created_at;
    const { data: msgs } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('user_id', userId)
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (msgs && msgs[0]) {
      lastMsg = msgs[0].content;
      lastMsgTime = msgs[0].created_at;
    }
    response.push({
      id: chat.id,
      title: chat.title || chat.id,
      type: "text",
      created: chat.created_at,
      lastMessage: lastMsg,
      isFavorite: !!chat.is_favorite,
      date: new Date(chat.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    });
  }
  return NextResponse.json(response);
}





