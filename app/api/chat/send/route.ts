import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Default educational teacher system prompt for regular chats
const DEFAULT_EDUCATIONAL_SYSTEM_PROMPT = `## Persona

You are an expert AI educator. Your persona is that of a patient, encouraging, and knowledgeable personal tutor who can teach any subject.

## Core Directive

Your primary goal is to teach users complex concepts, terminologies, tools, and processes for any subject. You must do this using a guided, Socratic method. Your main strategy is to ask questions to assess a user's knowledge before you explain a new concept. You must break down all complex topics into simple, easy-to-understand building blocks.

## Rules of Engagement

Assess Before Explaining (Prerequisite Check):

When a user asks about any topic (e.g., a scientific theory, a math formula, a historical event, a programming concept), your first action is to identify the key prerequisite concepts needed to understand it.

You must not give a direct definition or explanation immediately.

Instead, ask 1-2 simple questions to check if they know the prerequisite terms.

Mandatory Example Workflow (The "Prerequisite-First" Rule):

If User asks: "Can you explain photosynthesis?"

Your thought process: "To understand photosynthesis, they first need to know what 'cells' are and what 'energy' is in a biological context."

You must respond by asking: "Great question! To explain that, I first need to know: do you have a basic idea of what a plant 'cell' is and how it uses 'energy'?"

Adaptive Teaching Path (The "If/Then" Logic):

If the user says NO (or doesn't know the prerequisite): You must pause the original topic (e.g., "photosynthesis"). Your immediate next step is to teach the prerequisite concept (e.g., "plant cells") in simple terms. Once they understand it, then you can return to explaining the main topic.

If the user says YES (or answers your question correctly): You can proceed to explain the main topic (photosynthesis). You should still start simply, use examples, and avoid jargon.

Constant Evaluation (Test After Teaching):

After every new concept you explain (whether it's a prerequisite or the main topic), you must immediately test the user's learning.

Ask a simple, one-line comprehension question.

Example: After explaining photosynthesis, ask: "So, just to check, what are the two main ingredients a plant uses for photosynthesis?"

New Student Lesson Plan (The "Beginter" Rule):

If a user is new to a subject or asks "where do I start?" or "what should I learn first?", you must design a structured lesson plan.

This plan must start with the absolute fundamentals of that subject (e.g., for Python: "What is a variable?"; for History: "What is a primary source?") before moving to more complex topics.

## Tone

Simple & Clear: Use analogies. Avoid complex jargon unless you are specifically teaching it.

Encouraging: "Great question." "That's exactly right." "Almost, let's try looking at it this way."

Patient: Never make the user feel bad for not knowing a term. Treat every question as an opportunity to build their foundation.`;

async function getMessages(supabase: any, userId: string, chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Generate a concise chat title (1-4 words) from the first user message
async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const prompt = `Create a very short, concise title for this conversation. The title should be 1-4 words maximum, summarizing the main topic or question. 
    
Rules:
- No punctuation (no periods, commas, quotes, etc.)
- No emojis
- Use only the most important keywords
- Keep it as brief as possible while still being descriptive

User message: "${firstMessage.trim()}"

Return ONLY the title, nothing else:`;

    const titleRes = await fetch(OPENAI_API_URL, {
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
            content: 'You are a title generator. Generate very short, concise titles (1-4 words) with no punctuation or emojis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 15,
        temperature: 0.3,
      }),
    });

    const titleData = await titleRes.json();
    if (titleRes.ok && titleData.choices && titleData.choices[0]) {
      let title = titleData.choices[0].message.content.trim();
      // Clean up: remove any punctuation, quotes, emojis
      title = title.replace(/[.,;:!?'"()\[\]{}]/g, '').replace(/[^\w\s]/g, '').trim();
      // Limit to 50 characters and ensure it's not empty
      if (title && title.length > 0) {
        return title.slice(0, 50);
      }
    }
  } catch (error) {
    console.error('Error generating chat title:', error);
  }
  
  // Fallback: create a simple title from the first few words
  const words = firstMessage.trim().split(/\s+/).slice(0, 4);
  return words.join(' ') || 'New Chat';
}

export async function POST(req: Request) {
  try {
    // Get authenticated user (supports both Bearer token and cookie auth)
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user, supabase } = authResult;
    const userId = user.id;

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const { chatId = 'new-chat', content, teacherId } = body;
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content required.' }, { status: 400 });
    }

    // Generate UUID if chatId is "new-chat"
    const actualChatId = chatId === 'new-chat' ? randomUUID() : chatId;

    // 2: Check credits - handle case where user row might not exist
    let credits = 15; // Default credits
    const { data: creditData, error: creditError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (creditError && creditError.code !== 'PGRST116') {
      // Only return error if it's not a "no rows found" error
      return NextResponse.json({ error: creditError.message }, { status: 400 });
    }

    // If user row exists, use their credits; otherwise create row with defaults
    if (creditData && typeof creditData.credits === 'number') {
      credits = creditData.credits;
    } else if (!creditData) {
      // User row doesn't exist, create it with default credits
      const userEmail = user.email || '';
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, email: userEmail, credits: 15 });
      if (insertError) {
        console.error('Failed to create user row:', insertError);
        // Continue with default credits anyway
      } else {
        credits = 15; // Newly created user gets 15 credits
      }
    }

    if (credits < 1) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

    // 3: Insert user message to messages
    const now = new Date().toISOString();
    // Check if chat exists (handle errors properly)
    const { data: existingChat, error: chatCheckError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', actualChatId)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() to handle no rows gracefully
    
    // Track if this is a new chat (for title generation)
    const isNewChat = !existingChat && (!chatCheckError || chatCheckError.code === 'PGRST116');
    
    // If chat doesn't exist, create it with placeholder title
    if (isNewChat) {
      const insertData: any = { 
        id: actualChatId, 
        user_id: userId, 
        title: 'New Chat', // Placeholder, will be updated after AI response
        created_at: now 
      };
      // Store teacher_id in teacher_type field if provided
      if (teacherId && typeof teacherId === 'string') {
        insertData.teacher_type = teacherId;
      }
      const { error: insertError } = await supabase
        .from('chats')
        .insert(insertData);
      if (insertError) {
        return NextResponse.json({ error: `Failed to create chat: ${insertError.message}` }, { status: 400 });
      }
    } else if (chatCheckError && chatCheckError.code !== 'PGRST116') {
      return NextResponse.json({ error: `Failed to check chat: ${chatCheckError.message}` }, { status: 400 });
    }
    
    // Get teacher_id from existing chat if chat already exists and we don't have teacherId from request
    let resolvedTeacherId = teacherId;
    if (!resolvedTeacherId && existingChat) {
      const { data: chatData } = await supabase
        .from('chats')
        .select('teacher_type')
        .eq('id', actualChatId)
        .maybeSingle();
      if (chatData?.teacher_type) {
        resolvedTeacherId = chatData.teacher_type;
      }
    }
    
    const { error: messageInsertError } = await supabase
      .from('messages')
      .insert({ chat_id: actualChatId, user_id: userId, role: 'user', content, created_at: now });
    if (messageInsertError) {
      return NextResponse.json({ error: `Failed to save message: ${messageInsertError.message}` }, { status: 400 });
    }

    // 4: Load teacher system prompt if chat is associated with a teacher
    let teacherSystemPrompt = '';
    if (resolvedTeacherId) {
      try {
        const { data: teacher } = await supabase
          .from('custom_teachers')
          .select('system_prompt')
          .eq('id', resolvedTeacherId)
          .eq('user_id', userId) // Security: ensure teacher belongs to user
          .single();
        if (teacher?.system_prompt) {
          teacherSystemPrompt = teacher.system_prompt;
        }
      } catch (err) {
        console.error('Error fetching teacher system prompt:', err);
      }
    }

    // 5: Load personalization settings
    let userSystemPrompt = '';
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('teacher_personality, custom_instructions, call_me_by, about_user, enable_customization')
        .eq('user_id', userId)
        .maybeSingle();
      if (settings) {
        const parts: string[] = [];
        if (settings.enable_customization) {
          if (settings.teacher_personality) parts.push(`Adopt a ${settings.teacher_personality} teacher persona.`);
          // Custom instructions are the user's preferred teaching style/method - integrate directly
          if (settings.custom_instructions && settings.custom_instructions.trim()) {
            parts.push(settings.custom_instructions.trim());
          }
          if (settings.call_me_by) parts.push(`Address the user as "${settings.call_me_by}".`);
          if (settings.about_user) parts.push(`User background: ${settings.about_user}`);
        }
        if (parts.length) userSystemPrompt = parts.join('\n\n'); // Use double newline for better separation
      }
    } catch {}

    // 6: Call OpenAI with streaming
    // Create a ReadableStream to stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAnswer = '';
        let aiError: string | null = null;

        try {
          const messagesForAI = await getMessages(supabase, userId, actualChatId);
          // Build messages array: teacher system prompt first (if exists), else default educational prompt, then user settings, then conversation
          const systemMessages = [];
          if (teacherSystemPrompt) {
            systemMessages.push({ role: 'system', content: teacherSystemPrompt });
          } else {
            systemMessages.push({ role: 'system', content: DEFAULT_EDUCATIONAL_SYSTEM_PROMPT });
          }
          if (userSystemPrompt) {
            systemMessages.push({ role: 'system', content: userSystemPrompt });
          }
          
          const payload = {
            model: OPENAI_MODEL,
            messages: (
              systemMessages
              .concat(messagesForAI.map((m: any) => ({ role: m.role, content: m.content })))
              .concat([{ role: 'user', content }])
            ),
            max_tokens: 512,
            temperature: 0.7,
            stream: true, // Enable streaming
          };
          
          const aiRes = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify(payload),
          });

          if (!aiRes.ok) {
            const errorData = await aiRes.json().catch(() => ({ error: { message: 'Unknown AI error' } }));
            aiError = errorData.error ? errorData.error.message : 'Unknown AI error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: aiError })}\n\n`));
            controller.close();
            return;
          }

          // Parse OpenAI streaming response
          const reader = aiRes.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            aiError = 'No response body from OpenAI';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: aiError })}\n\n`));
            controller.close();
            return;
          }

          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) continue;
              
              // Handle OpenAI's [DONE] marker
              if (line.includes('[DONE]')) {
                continue;
              }

              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);

                // Handle content chunks
                if (data.choices && data.choices[0] && data.choices[0].delta) {
                  const content = data.choices[0].delta.content;
                  if (content) {
                    fullAnswer += content;
                    // Forward chunk to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                }

                // Handle finish reason (stream complete)
                if (data.choices && data.choices[0] && data.choices[0].finish_reason) {
                  // Stream is done
                  break;
                }
              } catch (e) {
                console.error('Error parsing OpenAI SSE chunk:', e);
              }
            }
          }

          // After streaming completes, save to DB and do post-processing
          try {
            // 7: Insert AI response
            const { error: aiMessageError } = await supabase
              .from('messages')
              .insert({ chat_id: actualChatId, user_id: userId, role: 'assistant', content: fullAnswer, created_at: new Date().toISOString() });
            if (aiMessageError) {
              console.error('Failed to save AI response:', aiMessageError);
            }
            
            // 7b: Generate and update chat title for new chats
            if (isNewChat && content.trim()) {
              try {
                const generatedTitle = await generateChatTitle(content);
                await supabase
                  .from('chats')
                  .update({ title: generatedTitle })
                  .eq('id', actualChatId)
                  .eq('user_id', userId);
              } catch (titleError) {
                console.error('Failed to update chat title:', titleError);
              }
            }
            
            // 8: Decrement credits
            const { error: updateError } = await supabase
              .from('users')
              .update({ credits: credits - 1 })
              .eq('id', userId);
            if (updateError) {
              console.error('Failed to decrement credits:', updateError);
            }

            // Send completion signal
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, chatId: actualChatId })}\n\n`));
          } catch (dbError) {
            console.error('Error saving to database:', dbError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to save response' })}\n\n`));
          }

          controller.close();
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: streamError instanceof Error ? streamError.message : 'Streaming failed' })}\n\n`));
          controller.close();
        }
      }
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/chat/send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

