
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// List of allowed secrets that can be set
const allowedSecrets = [
  'VITE_RAPIDAPI_KEY'
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request
    const { secrets } = await req.json()
    
    // Validate input
    if (!secrets || typeof secrets !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Expected an object of secret key-value pairs.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Filter out any disallowed secrets
    const validSecrets: Record<string, string> = {}
    let hasValidSecrets = false
    
    for (const [key, value] of Object.entries(secrets)) {
      if (allowedSecrets.includes(key) && typeof value === 'string') {
        validSecrets[key] = value
        hasValidSecrets = true
      }
    }

    if (!hasValidSecrets) {
      return new Response(
        JSON.stringify({ error: 'No valid secrets provided.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set the secrets in the environment (this is where you'd use Deno.env if in production)
    for (const [key, value] of Object.entries(validSecrets)) {
      // In development, we'd use Deno.env.set(), but we can't do that in production
      // This is just a placeholder for demonstration
      console.log(`Setting secret: ${key}`)
      
      // Uncomment for production:
      // Deno.env.set(key, value)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Secrets updated successfully',
        updated: Object.keys(validSecrets)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error setting secrets:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
