
#!/bin/bash

# Deploy check-drive-access function
echo "Deploying check-drive-access function..."
supabase functions deploy check-drive-access --no-verify-jwt

# Deploy check-url-access function
echo "Deploying check-url-access function..."
supabase functions deploy check-url-access --no-verify-jwt

# Deploy send-client-invitation function
echo "Deploying send-client-invitation function..."
supabase functions deploy send-client-invitation --no-verify-jwt

echo "Deployment complete!" 
