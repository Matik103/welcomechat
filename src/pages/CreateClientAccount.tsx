
import { useState } from 'react';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { generateTempPassword, saveClientTempPassword } from '@/utils/clientCreationUtils';
import { supabase } from '@/integrations/supabase/client';

const CreateClientAccount = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    setIsSubmitting(true);
    try {
      // First, create the agent in the ai_agents table
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          name: data.agent_name,
          interaction_type: 'config',
          content: '',
          settings: {
            client_name: data.client_name,
            email: data.email,
            agent_name: data.agent_name
          }
        })
        .select('id')
        .single();

      if (agentError) {
        throw new Error(`Failed to create client: ${agentError.message}`);
      }

      const agentId = agentData.id;

      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      // Save the temporary password
      await saveClientTempPassword(agentId, data.email, tempPassword);
      
      // Send welcome email with temporary password
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            to: data.email,
            subject: 'Welcome to Welcome.Chat - Your Account Details',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
                </div>
                
                <p>Hello ${data.client_name},</p>
                
                <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Email Address:</strong></p>
                  <p style="color: #4f46e5;">${data.email}</p>
                  
                  <p><strong>Temporary Password:</strong></p>
                  <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword}</p>
                </div>
                
                <p>To get started:</p>
                <ol>
                  <li>Click the "Sign In" button below</li>
                  <li>Enter your email and temporary password exactly as shown above</li>
                  <li>You'll be taken to your client dashboard</li>
                  <li>Configure your AI assistant's settings</li>
                </ol>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://welcomeai.io/client/auth" 
                     style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Sign In
                  </a>
                </div>
                
                <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
                  <p><strong>Security Notice:</strong></p>
                  <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
                </div>
                
                <p>Best regards,<br>The Welcome.Chat Team</p>
                
                <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
                </div>
              </div>
            `,
            from: 'Welcome.Chat <admin@welcome.chat>'
          }
        }
      );

      if (emailError) {
        console.error('Failed to send welcome email:', emailError);
        toast.error('Client created but failed to send welcome email');
      } else {
        toast.success('Client created successfully and welcome email sent');
      }

      // Log the activity
      await supabase.from('client_activities').insert({
        client_id: agentId,
        activity_type: 'client_created',
        description: 'New client created with AI agent',
        metadata: {
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name
        }
      });

      // Navigate back to clients list
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(`Failed to create client: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Client Account</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientAccountForm 
            onSubmit={handleSubmit} 
            isLoading={isSubmitting} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateClientAccount;
