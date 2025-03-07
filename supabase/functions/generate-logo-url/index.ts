
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body
    const { fileKey, clientId, bucketName } = await req.json()
    
    if (!fileKey || !clientId || !bucketName) {
      return new Response(
        JSON.stringify({ error: 'File key, client ID, and bucket name are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create Supabase client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileKey)

    console.log(`Generated public URL for ${fileKey}: ${publicUrl}`)

    // Update the client with the logo URL
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        widget_settings: supabase.storage.from('clients')
          .select('widget_settings')
          .eq('id', clientId)
          .then(({ data }) => {
            if (data && data[0] && data[0].widget_settings) {
              return {
                ...data[0].widget_settings,
                logo_url: publicUrl
              }
            }
            return { logo_url: publicUrl }
          })
      })
      .eq('id', clientId)

    if (updateError) {
      console.error('Error updating client:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ publicUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error generating logo URL:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
