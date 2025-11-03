import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

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
    // TODO: If using direct Supabase Auth, you may also call admin delete on user (if available/needed by setup).
    // Optionally, remove or revoke any 3rd-party auth/tokens.
    // Log out or invalidate session if supported
    // (Cannot always do this from inside the request, front end should redirect user to logout page afterwards)
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Delete failed' }, { status: 500 });
  }
}





