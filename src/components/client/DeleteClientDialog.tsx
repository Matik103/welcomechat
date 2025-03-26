
// Just updating the email_sent activity type to something valid
// Replacing line 116
await createClientActivity(
  client.id,
  "system_update", // Using a valid activity type
  `Deletion notification email sent to ${client.client_name}`,
  { 
    recipient_email: client.email,
    email_type: "deletion_notification",
    client_name: client.client_name,
    admin_action: true,
    successful: true
  }
);
