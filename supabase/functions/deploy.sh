
#!/bin/bash

# Deploy check-drive-access function
echo "Deploying check-drive-access function..."
supabase functions deploy check-drive-access --no-verify-jwt

# Deploy check-url-access function
echo "Deploying check-url-access function..."
supabase functions deploy check-url-access --no-verify-jwt

# Deploy send-invitation function
echo "Deploying send-invitation function..."
supabase functions deploy send-invitation --no-verify-jwt

echo "Deployment complete!" 
