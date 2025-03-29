
interface ClientInvitationParams {
  clientName: string;
  email: string;
  tempPassword: string;
  productName: string;
}

export const generateClientInvitationTemplate = ({
  clientName,
  email,
  tempPassword,
  productName
}: ClientInvitationParams): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${productName}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 20px;
    }
    .credentials {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #4F46E5;
    }
    .credentials p {
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eaeaea;
      color: #666;
      font-size: 12px;
    }
    .security-notice {
      background-color: #fffbeb;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .steps {
      margin: 20px 0;
    }
    .steps ol {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${productName}!</h1>
    </div>
    <div class="content">
      <p>Hello ${clientName},</p>
      
      <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
      
      <div class="credentials">
        <p><strong>Email Address:</strong><br>${email}</p>
        <p><strong>Temporary Password:</strong><br>${tempPassword}</p>
      </div>
      
      <div class="steps">
        <p><strong>To get started:</strong></p>
        <ol>
          <li>Click the "Sign In" button below</li>
          <li>Enter your email and temporary password exactly as shown above</li>
          <li>You'll be taken to your client dashboard</li>
          <li>Configure your AI assistant's settings</li>
        </ol>
      </div>
      
      <a href="https://welcome.chat/client/auth" class="button">Sign In</a>
      
      <div class="security-notice">
        <p><strong>Security Notice:</strong></p>
        <p>For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
      </div>
      
      <p>Best regards,<br>The ${productName} Team</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${productName}. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

interface DeletionNotificationParams {
  clientName: string;
  recoveryUrl: string;
  formattedDeletionDate: string;
}

export const generateDeletionNotificationTemplate = ({
  clientName,
  recoveryUrl,
  formattedDeletionDate
}: DeletionNotificationParams): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion Notice</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #F43F5E;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 20px;
    }
    .countdown {
      background-color: #fff2f5;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #F43F5E;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eaeaea;
      color: #666;
      font-size: 12px;
    }
    .warning-notice {
      background-color: #fffbeb;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .steps {
      margin: 20px 0;
    }
    .steps ol {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Deletion Notice</h1>
    </div>
    <div class="content">
      <p>Hello ${clientName},</p>
      
      <p>We're writing to inform you that your account has been scheduled for deletion.</p>
      
      <div class="countdown">
        <p><strong>Scheduled Deletion Date:</strong><br>${formattedDeletionDate}</p>
        <p>Your account and all associated data will be permanently deleted on this date.</p>
      </div>
      
      <p>If this was a mistake or you wish to keep your account, you can recover it by clicking the button below:</p>
      
      <a href="${recoveryUrl}" class="button">Recover My Account</a>
      
      <div class="warning-notice">
        <p><strong>Important:</strong></p>
        <p>After the scheduled deletion date, all your data will be permanently removed and cannot be recovered.</p>
      </div>
      
      <div class="steps">
        <p><strong>What will be deleted:</strong></p>
        <ul>
          <li>Your account profile and settings</li>
          <li>All website data and content</li>
          <li>Document uploads and linked content</li>
          <li>Chat history and interactions</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      
      <p>Best regards,<br>The Welcome.Chat Team</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};
