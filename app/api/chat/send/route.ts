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

// Helper function to get attachments with extracted text for a message
async function getAttachmentsWithText(supabase: any, userId: string, messageId: string): Promise<string> {
  try {
    console.log('[CHAT SEND] Fetching attachments for message:', messageId);
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('id, file_name, extracted_text, message_id')
      .eq('user_id', userId)
      .eq('message_id', messageId);
    
    console.log('[CHAT SEND] Found attachments:', attachments?.length || 0, 'Error:', error?.message);
    
    if (error || !attachments || attachments.length === 0) {
      return '';
    }
    
    // Build file content text
    let fileContent = '';
    for (const att of attachments) {
      console.log('[CHAT SEND] Attachment:', att.file_name, 'Has text:', !!att.extracted_text, 'Length:', att.extracted_text?.length || 0);
      if (att.extracted_text && att.extracted_text.trim()) {
        // Check if it's an error message
        if (att.extracted_text.includes('[File processing failed:') || 
            att.extracted_text.includes('Failed to extract')) {
          // Don't include error messages in the content - let AI know there was an issue
          fileContent += `\n\n[File: ${att.file_name} - Unable to extract text content. The file may be image-based, encrypted, or in an unsupported format.]\n`;
        } else {
          // Valid extracted text
          fileContent += `\n\n[File: ${att.file_name}]\n${att.extracted_text}\n`;
        }
      } else {
        // File hasn't been processed yet, mention it
        fileContent += `\n\n[File: ${att.file_name} - Processing in progress, content may be available shortly]\n`;
      }
    }
    
    console.log('[CHAT SEND] Final file content length:', fileContent.length);
    return fileContent;
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return '';
  }
}

async function getMessages(supabase: any, userId: string, chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  
  // For each user message, fetch and append file content
  const messagesWithFiles = await Promise.all(
    (data || []).map(async (m: any) => {
      if (m.role === 'user' && m.id) {
        const fileContent = await getAttachmentsWithText(supabase, userId, m.id);
        if (fileContent) {
          return {
            ...m,
            content: m.content + fileContent
          };
        }
      }
      return m;
    })
  );
  
  return messagesWithFiles;
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
    const { chatId = 'new-chat', content, teacherId, attachmentIds } = body;
    if ((!content || typeof content !== 'string' || !content.trim()) && (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachment is required.' }, { status: 400 });
    }
    
    // Use provided content or generate default for files
    const actualContent = (content && content.trim()) || (attachmentIds && attachmentIds.length > 0 
      ? `Please analyze the attached file${attachmentIds.length > 1 ? 's' : ''}.` 
      : '');

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
    
    const { data: insertedMessage, error: messageInsertError } = await supabase
      .from('messages')
      .insert({ chat_id: actualChatId, user_id: userId, role: 'user', content: actualContent, created_at: now })
      .select('id')
      .single();
    
    if (messageInsertError) {
      return NextResponse.json({ error: `Failed to save message: ${messageInsertError.message}` }, { status: 400 });
    }
    
    const userMessageId = insertedMessage?.id;
    
    // Get file attachments content for this message
    let fileContent = '';
    
    // Link attachments to this message if provided
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0 && userMessageId) {
      console.log('[CHAT SEND] Linking attachments:', attachmentIds, 'to message:', userMessageId);
      const { error: updateError } = await supabase
        .from('attachments')
        .update({ message_id: userMessageId })
        .in('id', attachmentIds)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('[CHAT SEND] Error linking attachments to message:', updateError);
      }
      
      // Wait for file processing to complete (with retries)
      // Some files might still be processing
      let retries = 0;
      const maxRetries = 10; // Try for up to 5 seconds (10 * 500ms)
      
      while (retries < maxRetries) {
        // Try to get attachments by attachment IDs (more reliable than message_id immediately after update)
        const { data: attachments, error: attachError } = await supabase
          .from('attachments')
          .select('id, file_name, extracted_text, message_id')
          .in('id', attachmentIds)
          .eq('user_id', userId);
        
        console.log(`[CHAT SEND] Retry ${retries + 1}/${maxRetries}: Found ${attachments?.length || 0} attachments`);
        
        if (!attachError && attachments && attachments.length > 0) {
          // Log raw extracted_text lengths for debugging
          attachments.forEach((att: any) => {
            console.log(`[CHAT SEND] Attachment ${att.file_name}: extracted_text length = ${att.extracted_text?.length || 0}, type = ${typeof att.extracted_text}`);
          });
          
          // Check if all files are processed (have extracted_text or error)
          const processed = attachments.filter(att => 
            att.extracted_text !== null && 
            att.extracted_text !== undefined &&
            (att.extracted_text.trim().length > 0 || 
             att.extracted_text.includes('[File processing failed:') ||
             att.extracted_text.includes('Failed to extract'))
          );
          
          console.log(`[CHAT SEND] Processed: ${processed.length}/${attachments.length} files`);
          
          if (processed.length === attachments.length && processed.length > 0) {
            // All files processed, build content
            for (const att of processed) {
              console.log(`[CHAT SEND] Building content for attachment: ${att.file_name}, extracted_text length: ${att.extracted_text?.length || 0}`);
              if (att.extracted_text && att.extracted_text.trim()) {
                if (att.extracted_text.includes('[File processing failed:') || 
                    att.extracted_text.includes('Failed to extract')) {
                  fileContent += `\n\n[File: ${att.file_name} - Unable to extract text content. The file may be image-based, encrypted, or in an unsupported format.]\n`;
                } else {
                  const textToAdd = att.extracted_text;
                  console.log(`[CHAT SEND] Adding ${textToAdd.length} characters from ${att.file_name}`);
                  fileContent += `\n\n[File: ${att.file_name}]\n${textToAdd}\n`;
                }
              }
            }
            console.log('[CHAT SEND] Successfully retrieved file content, total length:', fileContent.length);
            break;
          }
        }
        
        // Wait 500ms before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      
      // If still no content after retries, use the original function as fallback
      if (!fileContent) {
        console.log('[CHAT SEND] Retries exhausted, trying fallback method');
        fileContent = await getAttachmentsWithText(supabase, userId, userMessageId);
      }
    } else if (userMessageId) {
      // No attachmentIds provided, but check if message has any attachments
      fileContent = await getAttachmentsWithText(supabase, userId, userMessageId);
    }
    
    // Build the final content with file attachments
    const finalContent = actualContent + fileContent;
    console.log('[CHAT SEND] Final content length (message + files):', finalContent.length);

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
              .concat([{ role: 'user', content: finalContent }])
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
            // DEBUG: Log server-side content before DB insert (point 1)
            const hasMatrix = /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/.test(fullAnswer);
            if (hasMatrix) {
              const snippet = fullAnswer.slice(0, 200).replace(/\n/g, '\\n');
              const backslashCount = (fullAnswer.match(/\\\\/g) || []).length;
              console.log('[DEBUG POINT 1] Server received fullAnswer snippet:', JSON.stringify(snippet));
              console.log('[DEBUG POINT 1] Count of \\\\ sequences:', backslashCount);
              console.log('[DEBUG POINT 1] Full length:', fullAnswer.length);
            }
            
            // 7: Insert AI response
            const { error: aiMessageError } = await supabase
              .from('messages')
              .insert({ chat_id: actualChatId, user_id: userId, role: 'assistant', content: fullAnswer, created_at: new Date().toISOString() });
            if (aiMessageError) {
              console.error('Failed to save AI response:', aiMessageError);
            } else {
              // DEBUG: Log after DB insert (point 2) - verify what was saved
              const hasMatrix = /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/.test(fullAnswer);
              if (hasMatrix) {
                const { data: savedMsg } = await supabase
                  .from('messages')
                  .select('content')
                  .eq('chat_id', actualChatId)
                  .eq('user_id', userId)
                  .eq('role', 'assistant')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                if (savedMsg) {
                  const snippet = savedMsg.content.slice(0, 200).replace(/\n/g, '\\n');
                  const backslashCount = (savedMsg.content.match(/\\\\/g) || []).length;
                  console.log('[DEBUG POINT 2] After DB insert - saved content snippet:', JSON.stringify(snippet));
                  console.log('[DEBUG POINT 2] Count of \\\\ sequences:', backslashCount);
                }
              }
            }
            
            // 7b: Generate and update chat title for new chats
            if (isNewChat && actualContent.trim()) {
              try {
                const generatedTitle = await generateChatTitle(actualContent);
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

