import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, supabase } = authResult;
    const userId = user.id;

    let body;
    try { 
      body = await req.json(); 
    } catch { 
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); 
    }

    const { chatId = 'new-chat', teacherId } = body;
    
    if (!teacherId || typeof teacherId !== 'string') {
      return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
    }

    // Generate UUID if chatId is "new-chat"
    const actualChatId = chatId === 'new-chat' ? randomUUID() : chatId;
    const now = new Date().toISOString();

    // Check if chat exists
    const { data: existingChat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', actualChatId)
      .eq('user_id', userId)
      .maybeSingle();

    // Create chat if it doesn't exist
    if (!existingChat) {
      const { error: insertError } = await supabase
        .from('chats')
        .insert({ 
          id: actualChatId, 
          user_id: userId, 
          title: 'New Chat',
          teacher_type: teacherId,
          created_at: now 
        });
      if (insertError) {
        return NextResponse.json({ error: `Failed to create chat: ${insertError.message}` }, { status: 400 });
      }
    }

    // Check if welcome message already exists for this chat
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', actualChatId)
      .eq('role', 'assistant')
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      // Welcome message already exists, return chatId
      return NextResponse.json({ 
        chatId: actualChatId,
        message: 'Welcome message already exists',
        existing: true
      });
    }

    // Fetch teacher information including syllabus
    console.log('[WELCOME DEBUG] Fetching teacher:', { teacherId, userId });
    const { data: teacher, error: teacherError } = await supabase
      .from('custom_teachers')
      .select('system_prompt, syllabus_text, name')
      .eq('id', teacherId)
      .eq('user_id', userId)
      .single();

    if (teacherError || !teacher) {
      console.error('[WELCOME DEBUG] Teacher fetch error:', {
        error: teacherError,
        errorCode: teacherError?.code,
        errorMessage: teacherError?.message,
        teacherId,
        userId
      });
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    console.log('[WELCOME DEBUG] Teacher found:', {
      teacherId: teacher.id,
      name: teacher.name,
      hasSystemPrompt: !!teacher.system_prompt,
      systemPromptLength: teacher.system_prompt?.length || 0,
      hasSyllabusText: !!teacher.syllabus_text,
      syllabusTextLength: teacher.syllabus_text?.length || 0,
      syllabusPreview: teacher.syllabus_text?.substring(0, 200)
    });

    // Build welcome message prompt
    let welcomePrompt = `You are starting a new tutoring session. Based on the student's questionnaire responses and setup, generate a warm, personalized welcome message that:
1. Acknowledges the subject/field they want to learn
2. Mentions their knowledge level (if specified in your system prompt)
3. Acknowledges their learning goals (if specified in your system prompt)
4. If a syllabus was provided, mention that you've reviewed it and will align teaching with it
5. Expresses enthusiasm to help them learn
6. Mentions the starting topic they want to begin with (if specified in your system prompt)

Keep it concise (2-4 sentences) but warm and encouraging.`;

    // Include syllabus context if available
    if (teacher.syllabus_text && teacher.syllabus_text.trim()) {
      console.log('[WELCOME DEBUG] Including syllabus in welcome prompt:', {
        syllabusLength: teacher.syllabus_text.length,
        truncatedLength: Math.min(2000, teacher.syllabus_text.length)
      });
      welcomePrompt += `\n\nThe student has provided a syllabus. Here's the syllabus content:\n\n${teacher.syllabus_text.substring(0, 2000)}${teacher.syllabus_text.length > 2000 ? '...[truncated]' : ''}\n\nReference this syllabus when creating the welcome message.`;
    } else {
      console.log('[WELCOME DEBUG] No syllabus text available for welcome message');
    }

    // Include teacher system prompt context
    if (teacher.system_prompt) {
      welcomePrompt += `\n\nYour teaching persona and context:\n${teacher.system_prompt}`;
    }

    // Call OpenAI to generate welcome message
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are ${teacher.name || 'an AI tutor'}. Generate a personalized welcome message for a new student starting their learning journey.`
          },
          {
            role: 'user',
            content: welcomePrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({ error: { message: 'OpenAI API error' } }));
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to generate welcome message' 
      }, { status: 500 });
    }

    const aiData = await openAIResponse.json();
    const welcomeMessage = aiData.choices?.[0]?.message?.content || 'Hello! I\'m excited to help you learn. Let\'s get started!';

    // Save welcome message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: actualChatId,
        user_id: userId,
        role: 'assistant',
        content: welcomeMessage,
        created_at: now
      });

    if (messageError) {
      return NextResponse.json({ error: `Failed to save welcome message: ${messageError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      chatId: actualChatId,
      message: welcomeMessage,
      success: true
    });

  } catch (error) {
    console.error('Welcome message error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create welcome message' },
      { status: 500 }
    );
  }
}

