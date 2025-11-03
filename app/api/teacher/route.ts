import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const VALID_FIELDS = ['name', 'description', 'system_prompt', 'personality'];

export async function GET(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  const { data, error } = await supabase
    .from('custom_teachers')
    .select('id, name, description, system_prompt, personality, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json((data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    system_prompt: row.system_prompt,
    personality: row.personality,
    created_at: row.created_at
  })));
}

export async function POST(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const insert: any = { user_id: userId };
  for (const f of VALID_FIELDS) {
    if (typeof body[f] === 'string' && body[f]) insert[f] = body[f];
  }
  if (!insert.name || !insert.system_prompt) {
    return NextResponse.json({ error: 'Name and system_prompt required.' }, { status: 400 });
  }
  insert.id = randomUUID();
  const { data, error } = await supabase
    .from('custom_teachers')
    .insert(insert)
    .select('id, name, description, system_prompt, personality, created_at')
    .single();
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


