import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: any) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  const { fileId } = params;
  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single();
  if (error || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Respond with file metadata; for secure download, you could redirect to signed URL
  return NextResponse.json({ ...file });
}

export async function DELETE(req: Request, { params }: any) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  const { fileId } = params;
  // Fetch attachment for this user
  const { data: attachment, error } = await supabase
    .from('attachments')
    .select('id, user_id, file_path')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single();
  if (error || !attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Delete from Supabase Storage
  if (attachment.file_path) {
    await supabase.storage.from('chat-files').remove([attachment.file_path]);
  }
  // Delete attachment row
  await supabase.from('attachments').delete().eq('id', fileId).eq('user_id', userId);
  return NextResponse.json({ success: true });
}





