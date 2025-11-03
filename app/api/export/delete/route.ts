import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  try {
    // Find files to delete from storage
    const { data: files } = await supabase.from('files').select('path').eq('user_id', userId);
    if (files && files.length) {
      const filePaths = files.map((f: any) => f.path);
      await supabase.storage.from('chat-files').remove(filePaths);
    }
    // Delete DB rows in child-first order
    await supabase.from('messages').delete().eq('user_id', userId);
    await supabase.from('files').delete().eq('user_id', userId);
    await supabase.from('chats').delete().eq('user_id', userId);
    await supabase.from('custom_teachers').delete().eq('user_id', userId);
    try { await supabase.from('credit_transactions').delete().eq('user_id', userId); } catch {}
    // Delete user profile/session
    await supabase.from('profiles').delete().eq('id', userId);
    
    // Delete the Supabase Auth user so the old credentials can no longer log in
    // Requires SUPABASE_SERVICE_ROLE_KEY in server env (never exposed to client)
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin.auth.admin.deleteUser(userId);
    } catch (e) {
      // If admin delete fails, still return success for data deletion, but log server-side
      console.error('Admin deleteUser failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Delete failed' }, { status: 500 });
  }
}





