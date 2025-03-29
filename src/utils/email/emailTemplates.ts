
/**
 * Generates an HTML template for client invitation emails
 */
export function generateClientInvitationTemplate(params: {
  clientName?: string;
  email?: string;
  tempPassword?: string;
  productName?: string;
}): string {
  if (!params.clientName || !params.email || !params.tempPassword) {
    throw new Error("Missing required parameters for client invitation template");
  }
  
  console.log("Building client invitation template with params:", {
    clientName: params.clientName || 'Unknown',
    email: params.email || 'No email provided',
    hasPassword: !!params.tempPassword,
    productName: params.productName || 'Unknown'
  });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Welcome to ${params.productName || 'Welcome.Chat'}!</h1>
      </div>
      
      <p>Hello ${params.clientName || 'Client'},</p>
      
      <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email Address:</strong></p>
        <p style="color: #4f46e5;">${params.email || ''}</p>
        
        <p><strong>Temporary Password:</strong></p>
        <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${params.tempPassword || ''}</p>
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
      
      <p>Best regards,<br>The ${params.productName || 'Welcome.Chat'} Team</p>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} ${params.productName || 'Welcome.Chat'}. All rights reserved.
      </div>
    </div>
  `;
}

/**
 * Generates an HTML template for account deletion notification emails
 */
export function generateDeletionNotificationTemplate(params: {
  clientName?: string;
  recoveryUrl: string;
  formattedDeletionDate: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff4a4a;">Account Scheduled for Deletion</h1>
      </div>
      
      <p>Hello ${params.clientName || 'Client'},</p>
      
      <p>Your account has been scheduled for deletion. All your data will be <strong>permanently removed</strong> on ${params.formattedDeletionDate}.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>If this was a mistake</strong>, you can recover your account by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.recoveryUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Recover My Account
          </a>
        </div>
        
        <p>This recovery link will expire on ${params.formattedDeletionDate}.</p>
      </div>
      
      <p>If you intended to delete your account, no further action is required. Your data will be automatically removed after the deletion date.</p>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
        <p><strong>What gets deleted?</strong></p>
        <ul style="margin-top: 5px;">
          <li>All website URLs and content</li>
          <li>All document links and content</li>
          <li>Chat history and interactions</li>
          <li>Account settings and configurations</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Best regards,<br>The Welcome.Chat Team</p>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
      </div>
    </div>
  `;
}
