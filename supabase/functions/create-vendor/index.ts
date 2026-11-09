import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase client with Service Role (Admin power)
    // NOTE: Changed to SERVICE_ROLE_KEY because Supabase blocks the SUPABASE_ prefix
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 2. Get the data sent from the frontend
    const { email, password, business_name, category, address, whatsapp_number, image_url } = await req.json()

    // 3. Create the Auth User WITHOUT sending an email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // This bypasses the email rate limit completely
      user_metadata: { full_name: business_name, role: 'vendor' }
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 4. Insert into the Vendors Table
    const { data: vendorData, error: vendorError } = await supabaseAdmin.from('vendors').insert({
      business_name: business_name,
      category: category,
      address: address,
      whatsapp_number: whatsapp_number,
      image_url: image_url,
      is_active: true
    }).select().single()

    if (vendorError) throw vendorError

    // 5. Insert into the Profiles Table
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      full_name: business_name,
      role: 'vendor',
      vendor_id: vendorData.id
    })

    if (profileError) throw profileError

    return new Response(JSON.stringify({ message: "Vendor created successfully", vendor_id: vendorData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})