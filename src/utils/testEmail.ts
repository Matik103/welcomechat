
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailSending() {
  console.log('Starting email sending test...');

  // Test 1: Direct Resend
  try {
    console.log('Testing direct Resend email sending...');
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'WelcomeChat <admin@welcome.chat>',
      to: 'delivered@resend.dev',
      subject: 'Test Email via Direct Resend',
      html: `
        <div>
          <h1>Test Email</h1>
          <p>This is a test email sent directly via Resend.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    });

    if (resendError) {
      console.error('Direct Resend test failed:', resendError);
    } else {
      console.log('Direct Resend test succeeded:', resendData);
    }
  } catch (error) {
    console.error('Direct Resend test error:', error);
  }

  // Test 2: Supabase Edge Function
  try {
    console.log('Testing Supabase Edge Function email sending...');
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'delivered@resend.dev',
        subject: 'Test Email via Edge Function',
        html: `
          <div>
            <h1>Test Email</h1>
            <p>This is a test email sent via Supabase Edge Function.</p>
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        `,
        from: 'WelcomeChat <admin@welcome.chat>'
      }
    });

    if (edgeError) {
      console.error('Edge Function test failed:', edgeError);
    } else {
      console.log('Edge Function test succeeded:', edgeData);
    }
  } catch (error) {
    console.error('Edge Function test error:', error);
  }
}

// Run the test
testEmailSending()
  .then(() => {
    console.log('Email tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Email tests failed:', error);
    process.exit(1);
  }); 
