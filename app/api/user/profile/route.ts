import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'auto',
  teacher_personality: 'default',
  custom_instructions: '',
  call_me_by: 'Chief',
  about_user: '',
  enable_customization: true,
  save_chat_history: true,
  improve_model: true,
};

export async function GET(req: Request) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user: authUser, supabase } = authResult;
    const userId = authUser.id;

    const [{ data: user, error: userErr }, { data: settings, error: settingsErr }] = await Promise.all([
      supabase.from('users').select('id, email, name, credits, subscription_plan').eq('id', userId).single(),
      supabase.from('user_settings').select('theme, language, teacher_personality, custom_instructions, call_me_by, about_user, enable_customization, save_chat_history, improve_model').eq('user_id', userId).maybeSingle(),
    ]);
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 });
    // Ignore settingsErr if it's just "no rows found", otherwise log it
    if (settingsErr && settingsErr.code !== 'PGRST116') {
      console.error('Error fetching user settings:', settingsErr);
    }
    const combined = {
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits ?? 0,
      subscription_plan: user.subscription_plan,
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
    };
    return NextResponse.json(combined);
  } catch (error) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authResult;
    const userId = user.id;

    let incoming: any = {};
    try { incoming = await req.json(); } catch { return NextResponse.json({ error: 'Invalid input' }, { status: 400 }); }

    // Split to users vs user_settings
    const userUpdates: any = {};
    if (typeof incoming.name === 'string') userUpdates.name = incoming.name;
    if (typeof incoming.subscription_plan === 'string') userUpdates.subscription_plan = incoming.subscription_plan;
    if (typeof incoming.credits === 'number') userUpdates.credits = incoming.credits;

    const settingsUpdates: any = {};
    const settingsMap = [
      'theme', 'language', 'teacher_personality', 'custom_instructions', 'call_me_by', 'about_user',
      'enable_customization', 'save_chat_history', 'improve_model',
    ];
    for (const key of settingsMap) {
      if (key in incoming) settingsUpdates[key] = incoming[key];
    }

    const tasks: Promise<any>[] = [];
    if (Object.keys(userUpdates).length) {
      tasks.push(
        supabase.from('users').update(userUpdates).eq('id', userId)
      );
    }

    // Handle settings update separately (can't use Promise.all with conditional await)
    if (Object.keys(settingsUpdates).length) {
      // Check if user_settings row exists for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let settingsResult;
      if (existingSettings) {
        // Update existing row
        settingsResult = await supabase.from('user_settings')
          .update(settingsUpdates)
          .eq('user_id', userId);
      } else {
        // Insert new row
        settingsResult = await supabase.from('user_settings')
          .insert({ user_id: userId, ...settingsUpdates });
      }
      
      if (settingsResult.error) {
        return NextResponse.json({ error: settingsResult.error.message }, { status: 400 });
      }
    }

    if (tasks.length === 0 && Object.keys(settingsUpdates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Execute user updates if any
    if (tasks.length > 0) {
      const results = await Promise.all(tasks);
      for (const r of results) {
        if (r.error) {
          return NextResponse.json({ error: r.error.message }, { status: 400 });
        }
      }
    }

    // Return latest with full settings from database
    const [{ data: updatedUser, error: userErr }, { data: settings, error: settingsErr }] = await Promise.all([
      supabase.from('users').select('id, email, name, credits, subscription_plan').eq('id', userId).maybeSingle(),
      supabase.from('user_settings').select('theme, language, teacher_personality, custom_instructions, call_me_by, about_user, enable_customization, save_chat_history, improve_model').eq('user_id', userId).maybeSingle(),
    ]);
    
    if (userErr) {
      console.error('Error fetching user after update:', userErr);
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 });
    }
    
    if (updatedUser?.id) {
      return NextResponse.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        credits: updatedUser.credits ?? 0,
        subscription_plan: updatedUser.subscription_plan,
        ...DEFAULT_SETTINGS,
        ...(settings || {}),
      });
    }
    return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 });
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


