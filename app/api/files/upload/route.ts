import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Use Node.js runtime for PDF extraction
export const runtime = 'nodejs';

// Removed deprecated config - App Router handles this automatically

async function parseMultipart(req: Request) {
  // Note: Node.js 'formidable'/'busboy' needed for prod; here, assume edge/serverless can get FormData
  if (typeof req.formData !== 'function') throw new Error('Edge runtime required');
  const form = await req.formData();
  const file = form.get('file');
  const chatId = form.get('chatId');
  if (!file || typeof file === 'string' || !chatId || typeof chatId !== 'string') {
    throw new Error('Must provide file (as File) and chatId (as string)');
  }
  return { file, chatId };
}

export async function POST(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  let file: File, chatId: string;
  try {
    ({ file, chatId } = await parseMultipart(req));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
  
  // Generate UUID if chatId is "new-chat"
  const actualChatId = chatId === 'new-chat' ? randomUUID() : chatId;
  
  // Ensure chat exists (create if needed)
  const now = new Date().toISOString();
  const { data: existingChat } = await supabase
    .from('chats')
    .select('id')
    .eq('id', actualChatId)
    .eq('user_id', userId)
    .maybeSingle();
  
  // Validate file size/type
  const size = file.size;
  if (size > 30 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 413 });
  const mime = file.type || 'application/octet-stream';
  const ext = (file.name || '').split('.').pop();
  const filename = file.name || `upload.${ext}`;
  
  if (!existingChat) {
    // Generate a title from the filename or use default
    const chatTitle = filename || 'File Upload';
    const { error: insertError } = await supabase
      .from('chats')
      .insert({ 
        id: actualChatId, 
        user_id: userId, 
        title: chatTitle,
        created_at: now 
      });
    if (insertError) {
      return NextResponse.json({ error: `Failed to create chat: ${insertError.message}` }, { status: 400 });
    }
  }
  const storagePath = `${userId}/${Date.now()}-${filename}`;
  // Upload to Supabase Storage via signed URL REST
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Extract text if it's a PDF
  let extractedText = null;
  if (mime === 'application/pdf' || ext?.toLowerCase() === 'pdf') {
    try {
      const { extractTextFromBuffer } = await import('@/lib/pdfExtractor');
      extractedText = await extractTextFromBuffer(buffer);
      console.log('[UPLOAD DEBUG] PDF text extracted, length:', extractedText.length);
    } catch (extractErr) {
      console.error('[UPLOAD DEBUG] PDF extraction failed:', extractErr);
      // Continue with upload even if extraction fails
    }
  }
  
  const { data: storageRes, error: uploadErr } = await supabase.storage
    .from('chat-files')
    .upload(storagePath, new Uint8Array(bytes), { contentType: mime });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  // Get public URL
  const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(storagePath);
  const url = urlData?.publicUrl;
  if (!url) return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
  // Create a message placeholder and link attachment record
  const createdAt = new Date().toISOString();
  const { data: messageRow, error: messageErr } = await supabase
    .from('messages')
    .insert({ chat_id: actualChatId, user_id: userId, role: 'user', content: filename, created_at: createdAt })
    .select('id')
    .single();
  if (messageErr) return NextResponse.json({ error: messageErr.message }, { status: 500 });

  const { data: attachmentRow, error: attachErr } = await supabase
    .from('attachments')
    .insert({
      user_id: userId,
      message_id: messageRow.id,
      file_name: filename,
      file_path: storagePath,
      file_size: size,
      file_type: mime,
      extracted_text: extractedText, // Store extracted text if available
    })
    .select('id, created_at')
    .single();
  if (attachErr) return NextResponse.json({ error: attachErr.message }, { status: 500 });
  // Respond
  return NextResponse.json({
    id: attachmentRow.id,
    url,
    filename,
    size,
    mime,
    chatId: actualChatId, // Return actual UUID
    uploadedAt: attachmentRow.created_at,
    messageId: messageRow.id,
    extractedTextLength: extractedText?.length ?? null,
  });
}

