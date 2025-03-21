
#!/bin/bash

# Deploy check-drive-access function
echo "Deploying check-drive-access function..."
supabase functions deploy check-drive-access --no-verify-jwt

# Deploy check-url-access function
echo "Deploying check-url-access function..."
supabase functions deploy check-url-access --no-verify-jwt

# Deploy check-email-exists function
echo "Deploying check-email-exists function..."
supabase functions deploy check-email-exists --no-verify-jwt

# Deploy get_agent_dashboard_stats function
echo "Deploying get_agent_dashboard_stats function..."
supabase functions deploy get_agent_dashboard_stats --no-verify-jwt

# Deploy execute_sql function
echo "Deploying execute_sql function..."
supabase functions deploy execute_sql --no-verify-jwt

# Deploy get_client_agent_data function
echo "Deploying get_client_agent_data function..."
supabase functions deploy get_client_agent_data --no-verify-jwt

# Deploy get_client_agent_names function (for n8n integration)
echo "Deploying get_client_agent_names function..."
supabase functions deploy get_client_agent_names --no-verify-jwt

# Deploy the error logging function
echo "Deploying log_agent_error function..."
supabase functions deploy log_agent_error --no-verify-jwt

# Deploy the chat function
echo "Deploying chat function..."
supabase functions deploy chat --no-verify-jwt

# Deploy the create-openai-assistant function
echo "Deploying create-openai-assistant function..."
supabase functions deploy create-openai-assistant --no-verify-jwt

# Deploy the send-email function
echo "Deploying send-email function..."
supabase functions deploy send-email --no-verify-jwt

echo "Deployment complete!" 
