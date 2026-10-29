import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, user_id, new_password, is_active } = await req.json();

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'reset_password') {
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
    } 
    else if (action === 'toggle_active') {
      // 1. Update auth user (bans them from logging in)
      const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, { 
        ban_duration: is_active ? 'none' : '876000h' // 100 years if deactivated
      });
      if (authError) throw authError;

      // 2. Update profile table
      const { error: profileError } = await adminClient.from('profiles').update({ is_active }).eq('id', user_id);
      if (profileError) throw profileError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});