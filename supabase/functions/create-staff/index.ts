import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, role } = await req.json();

    // Use the Service Role key to bypass security and create an auth user
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create the Auth User
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm so they can log in immediately
    });

    if (authError) throw new Error("Auth Error: " + authError.message);

    // 2. Create the Profile row linked to the new Auth User ID
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authData.user.id,
      full_name: full_name,
      role: role
    });

    if (profileError) throw new Error("Profile Error: " + profileError.message);

    return new Response(
      JSON.stringify({ success: true, message: 'Staff created' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
