
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const TestEmailComponent = () => {
  const [isTestingSending, setIsTestingSending] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: Date;
  } | null>(null);

  const handleTestEmail = async () => {
    try {
      setIsTestingSending(true);
      const toastId = toast.loading("Sending test email...");
      
      // Call the send-email Edge Function directly to test email sending
      console.log("Calling send-email Edge Function directly...");
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "send-email",
        {
          body: {
            to: "test@example.com", // Replace with your actual test email in production
            subject: "Test Email from Welcome.Chat",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #4f46e5;">Welcome.Chat Test Email</h1>
                </div>
                
                <p>Hello,</p>
                
                <p>This is a test email to verify the email sending functionality is working correctly.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Test Details:</strong></p>
                  <ul style="list-style-type: none; padding: 0;">
                    <li>Time: ${new Date().toLocaleString()}</li>
                    <li>Environment: Development</li>
                    <li>Service: Resend.com</li>
                  </ul>
                </div>
                
                <p>If you received this email, it means the email sending functionality is working properly.</p>
                
                <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} Welcome.Chat - Test Email
                </div>
              </div>
            `,
            from: "Welcome.Chat <admin@welcome.chat>"
          }
        }
      );
      
      console.log("Edge Function response:", { data: emailData, error: emailError });
      
      if (emailError) {
        console.error("Edge Function error:", emailError);
        toast.error(`Edge Function error: ${emailError.message}`, { id: toastId });
        setLastTestResult({
          success: false,
          message: `Edge function error: ${emailError.message}`,
          timestamp: new Date()
        });
        return;
      }
      
      if (emailData?.success) {
        toast.success("Test email sent successfully!", { id: toastId });
        setLastTestResult({
          success: true,
          message: "Email sent successfully",
          timestamp: new Date()
        });
      } else {
        console.error("Email send failed:", emailData?.error);
        toast.error(`Failed to send test email: ${emailData?.error}`, { id: toastId });
        setLastTestResult({
          success: false,
          message: `Email sending failed: ${emailData?.error || "Unknown error"}`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Error in handleTestEmail:", error);
      toast.error(`Error sending test email: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLastTestResult({
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date()
      });
    } finally {
      setIsTestingSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleTestEmail}
        variant="outline"
        disabled={isTestingSending}
      >
        {isTestingSending ? "Sending Test Email..." : "Send Test Email"}
      </Button>
      
      {lastTestResult && (
        <Alert variant={lastTestResult.success ? "default" : "destructive"}>
          <Info className="h-4 w-4" />
          <AlertTitle>
            {lastTestResult.success 
              ? "Email Test Successful" 
              : "Email Test Failed"}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {lastTestResult.message}
            <div className="mt-1 opacity-70">
              {lastTestResult.timestamp.toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
