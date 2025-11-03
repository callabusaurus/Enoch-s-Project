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
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    
    // Fetch attachments for user messages
    const messagesWithAttachments = await Promise.all(
      (data || []).map(async (m) => {
        if (m.role === 'user') {
          const { data: attachments } = await supabase
            .from('attachments')
            .select('id, file_name, file_type, file_size, file_path')
            .eq('message_id', m.id)
            .eq('user_id', userId);
          
          if (attachments && attachments.length > 0) {
            // Get URLs for attachments
            const attachmentsWithUrls = await Promise.all(
              attachments.map(async (att: any) => {
                const { data: urlData } = supabase.storage
                  .from('chat-files')
                  .getPublicUrl(att.file_path);
                return {
                  id: att.id,
                  url: urlData?.publicUrl || '',
                  filename: att.file_name,
                  file_type: att.file_type,
                  file_size: att.file_size
                };
              })
            );
            return {
              type: 'user',
              content: m.content,
              messageId: m.id,
              attachments: attachmentsWithUrls
            };
          }
        }
        return {
          type: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
          messageId: m.id
        };
      })
    );
    
    const messages = messagesWithAttachments;
    
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

