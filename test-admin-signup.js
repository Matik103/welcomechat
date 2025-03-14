import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabasePublishableKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testAdminSignup() {
  try {
    // Generate test data
    const timestamp = Date.now()
    const testEmail = `testadmin${timestamp}@gmail.com`
    const testName = `Test Admin ${timestamp}`
    const testPassword = `Welcome${timestamp}!`

    console.log('Testing admin signup with:')
    console.log('Email:', testEmail)
    console.log('Name:', testName)
    console.log('Temporary Password:', testPassword)

    // Sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'admin',
          needs_password_change: true
        }
      }
    })

    if (signUpError) {
      throw signUpError
    }

    console.log('\nSignup successful:', signUpData)

    // Wait for 2 seconds before sending welcome email
    console.log('\nWaiting for 2 seconds before sending welcome email...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Send welcome email
    const { data: welcomeData, error: welcomeError } = await supabaseAdmin.functions.invoke('send-admin-welcome', {
      body: {
        email: testEmail,
        fullName: testName,
        temporaryPassword: testPassword
      }
    })

    if (welcomeError) {
      throw welcomeError
    }

    console.log('Welcome email sent:', welcomeData)

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

testAdminSignup() 