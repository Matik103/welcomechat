
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// List of allowed secrets that can be requested
const allowedSecrets = [
  'LLAMA_CLOUD_API_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'VITE_RAPIDAPI_KEY'
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request to get the keys
    const { keys } = await req.json()
    
    // Validate input
    if (!keys || !Array.isArray(keys)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Expected an array of secret keys.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Filter out any disallowed secrets
    const validKeys = keys.filter(key => 
      typeof key === 'string' && allowedSecrets.includes(key)
    )

    if (validKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid secret keys requested.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create result object with the requested secrets
    const result: Record<string, string> = {}
    
    for (const key of validKeys) {
      const value = Deno.env.get(key)
      if (value) {
        result[key] = value
      } else {
        console.error(`Requested secret ${key} is not set in environment variables`)
      }
    }
    
    // Check if we're missing any requested secrets and log this information
    const missingKeys = validKeys.filter(key => !result[key])
    if (missingKeys.length > 0) {
      console.warn(`The following requested secrets are missing: ${missingKeys.join(', ')}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
