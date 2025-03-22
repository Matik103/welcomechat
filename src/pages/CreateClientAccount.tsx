
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { TestEmailComponent } from '@/components/client/TestEmailComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function CreateClientAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Show loading toast
      const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
      
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      console.log("Creating client with data:", data);
      console.log("Using temporary password:", tempPassword);

      // Create the client/agent in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          company: data.company || null,
          name: data.agent_name || "AI Assistant",
          agent_description: data.agent_description || "", 
          content: "",
          interaction_type: 'config',
          settings: {
            agent_name: data.agent_name || "AI Assistant",
            agent_description: data.agent_description || "",
            logo_url: "",
            client_name: data.client_name,
            email: data.email,
            company: data.company || null
          }
        })
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);
      
      console.log("Client created successfully:", clientData);
      
      // Save the temporary password
      const { error: passwordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: clientData.id,
          email: data.email,
          temp_password: tempPassword
        });
        
      if (passwordError) {
        console.error("Error saving temporary password:", passwordError);
        // Continue even if password save fails
      }

      // Update email status
      setEmailStatus('sending');

      // Call the edge function to send the welcome email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-email', 
        {
          body: {
            to: data.email,
            subject: "Welcome to Welcome.Chat - Your Account Details",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
                </div>
                
                <p>Hello ${data.client_name || 'Client'},</p>
                
                <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Email Address:</strong></p>
                  <p style="color: #4f46e5;">${data.email || ''}</p>
                  
                  <p><strong>Temporary Password:</strong></p>
                  <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword || ''}</p>
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
            from: "Welcome.Chat <admin@welcome.chat>"
          }
        }
      );
      
      if (emailError) {
        console.error("Email sending error:", emailError);
        setEmailStatus('error');
        toast.error(`Client created but welcome email failed: ${emailError.message}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else if (emailResult && !emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        setEmailStatus('error');
        toast.error(`Client created but welcome email failed: ${emailResult.error || "Unknown error"}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else {
        setEmailStatus('success');
        toast.success("Client created successfully and welcome email sent", {
          id: loadingToastId
        });
      }
      
      // Create OpenAI assistant with the description (this would be automatically handled by a trigger)
      try {
        const { data: assistantResult, error: assistantError } = await supabase.functions.invoke(
          'create-openai-assistant',
          {
            body: {
              client_id: clientData.id,
              agent_name: data.agent_name || "AI Assistant",
              agent_description: data.agent_description || "",
              client_name: data.client_name
            }
          }
        );
        
        if (assistantError) {
          console.error("Failed to create OpenAI assistant:", assistantError);
        } else {
          console.log("OpenAI assistant created:", assistantResult);
        }
      } catch (assistantErr) {
        console.error("Error creating OpenAI assistant:", assistantErr);
        // Continue even if assistant creation fails
      }
      
      // Force refresh of client list
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Short delay before navigating to ensure notifications are visible
      setTimeout(() => {
        navigate("/admin/clients");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Client Account</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientAccountForm onSubmit={handleSubmit} isLoading={isSubmitting} />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Before creating a client, you can verify that email sending is working correctly.
              </p>
              <TestEmailComponent />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Client Creation Process</AlertTitle>
                <AlertDescription>
                  When you submit the form, we'll:
                  <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                    <li>Create a new AI agent in the database</li>
                    <li>Generate a secure temporary password</li>
                    <li>Send a welcome email with login details</li>
                    <li>Set up the OpenAI assistant (if enabled)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
