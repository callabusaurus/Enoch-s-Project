import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

const FIELDS = ['name','description','system_prompt','personality'];

export async function GET(req: Request, { params }: any) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const { teacherId } = params;
  const { data, error } = await supabase
    .from('custom_teachers')
    .select('id, name, description, system_prompt, personality, user_id, created_at')
    .eq('id', teacherId)
    .single();
  if (error || data.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description || '',
    system_prompt: data.system_prompt,
    personality: data.personality,
    created_at: data.created_at
  });
}

export async function PUT(req: Request, { params }: any) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const { teacherId } = params;
  let body = {};
  try { body = await req.json(); } catch {}
  const updates: any = {};
  for (const f of FIELDS) {
    if (typeof body[f] === 'string' && body[f]) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  // Only allow updating owned teachers
  const { data: check, error: err0 } = await supabase
    .from('custom_teachers')
    .select('user_id').eq('id', teacherId).single();
  if (err0 || check.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await supabase
    .from('custom_teachers')
    .update(updates).eq('id', teacherId)
    .select('id, name, description, system_prompt, personality, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description || '',
    system_prompt: data.system_prompt,
    personality: data.personality,
    created_at: data.created_at
  });
}

export async function DELETE(req: Request, { params }: any) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const { teacherId } = params;
  // Only allow deleting owned teachers
  const { data: check, error: err0 } = await supabase
    .from('custom_teachers')
    .select('user_id').eq('id', teacherId).single();
  if (err0 || check.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { error } = await supabase
    .from('custom_teachers')
    .delete()
    .eq('id', teacherId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}


