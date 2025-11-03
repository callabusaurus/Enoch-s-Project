import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authResult;
    const userId = user.id;
    const { searchParams } = new URL(req.url!);
    const chatId = searchParams.get('chatId') || 'new-chat';
    
    // Handle "new-chat" case gracefully - return empty messages since no chat exists yet
    if (chatId === 'new-chat') {
      return NextResponse.json({ messages: [], teacherId: null });
    }
    
    // Messages for this chat + user
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const messages = (data || []).map(m => ({ type: m.role === 'assistant' ? 'ai' : 'user', content: m.content }));
    
    // Optionally fetch teacher_type from chat for frontend use
    const { data: chatData } = await supabase
      .from('chats')
      .select('teacher_type')
      .eq('id', chatId)
      .eq('user_id', userId)
      .maybeSingle();
    
    return NextResponse.json({ 
      messages,
      teacherId: chatData?.teacher_type || null 
    });
  } catch (error) {
    console.error('Error in GET /api/chat/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

