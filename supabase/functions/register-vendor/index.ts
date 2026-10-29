import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, password, business_name, category, whatsapp_number, image_url, address } = await req.json();

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create Auth User
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (authError) throw authError;

    // 2. Create Vendor Profile
    const { data: vendorData, error: vendorError } = await adminClient.from('vendors').insert({
      business_name,
      category,
      whatsapp_number,
      phone_number: whatsapp_number,
      image_url,
      address,
      is_active: true
    }).select().single();
    if (vendorError) throw vendorError;

    // 3. Link Vendor to Auth User in Profiles
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authData.user.id,
      full_name: business_name,
      role: 'vendor',
      vendor_id: vendorData.id
    });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});