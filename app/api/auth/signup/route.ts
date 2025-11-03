import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Insert into public.users on signup success
    if (data.user) {
      const { id, email: userEmail } = data.user;
      
      // Use service role client to bypass RLS for user creation
      if (supabaseServiceKey) {
        const adminClient = createClient<Database>(
          supabaseUrl,
          supabaseServiceKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        const { error: insertError } = await adminClient
          .from('users')
          .insert([{ id, email: userEmail, credits: 15 }]);
        
        if (insertError) {
          console.error('Error inserting user with service role:', insertError);
          // Check if user already exists (might have been created by trigger)
          const { data: existingUser } = await adminClient
            .from('users')
            .select('id')
            .eq('id', id)
            .maybeSingle();
          
          if (!existingUser) {
            return NextResponse.json({ 
              error: `Database error saving new user: ${insertError.message}` 
            }, { status: 500 });
          }
          // User already exists, continue successfully
        }
      } else {
        // Fallback: try with regular client (might fail due to RLS)
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id, email: userEmail, credits: 15 }]);
        
        if (insertError) {
          console.error('Error inserting user:', insertError);
          return NextResponse.json({ 
            error: `Database error saving new user: ${insertError.message}. Service role key may be missing.` 
          }, { status: 500 });
        }
      }
    } else {
      // User not returned (likely email confirmation required)
      // Return success - user record will be created on email confirmation or by trigger
      return NextResponse.json({ 
        success: true, 
        message: 'Signup successful. Please check your email to verify your account.' 
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Server error' 
    }, { status: 500 });
  }
}





