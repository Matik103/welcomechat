import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadLogo() {
  try {
    const agentId = '8a15d02e-f63f-479b-a1c9-1d15ae08358d';
    const filePath = 'test-assets/test-logo.svg';
    const fileContent = readFileSync(filePath);
    
    // Upload to bot-logos bucket
    console.log('Uploading file...');
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('bot-logos')
      .upload(`${agentId}/${uuid()}.svg`, fileContent, {
        contentType: 'image/svg+xml',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }
    
    console.log('Upload successful!', uploadData);
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('bot-logos')
      .getPublicUrl(uploadData.path);
      
    console.log('Public URL:', urlData.publicUrl);
    
    // Update the ai_agent record with the logo URL
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        logo_url: urlData.publicUrl,
        logo_storage_path: uploadData.path
      })
      .eq('id', agentId);
      
    if (updateError) {
      console.error('Error updating ai_agent:', updateError);
      return;
    }
    
    console.log('AI agent record updated successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadLogo(); 