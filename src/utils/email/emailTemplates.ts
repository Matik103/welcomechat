
interface DeletionTemplateParams {
  clientName: string;
  recoveryUrl: string;
  formattedDeletionDate: string;
}

/**
 * Generates HTML template for client deletion notification emails
 */
export const generateDeletionNotificationTemplate = (params: DeletionTemplateParams): string => {
  const { clientName, recoveryUrl, formattedDeletionDate } = params;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff4a4a;">Account Scheduled for Deletion</h1>
      </div>
      
      <p>Hello ${clientName || 'Client'},</p>
      
      <p>Your account has been scheduled for deletion. All your data will be <strong>permanently removed</strong> on ${formattedDeletionDate}.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>If this was a mistake</strong>, you can recover your account by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Recover My Account
          </a>
        </div>
        
        <p>This recovery link will expire on ${formattedDeletionDate}.</p>
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
};
