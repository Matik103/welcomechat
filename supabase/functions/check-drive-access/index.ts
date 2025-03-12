import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DriveCheckResult {
  isAccessible: boolean;
  isPublic: boolean;
  sharingLevel?: "private" | "restricted" | "public";
  error?: string;
}

function extractFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)\//, // Standard file URL
    /\/folder\/([a-zA-Z0-9_-]+)/, // Folder URL
    /\/document\/d\/([a-zA-Z0-9_-]+)/, // Google Doc
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, // Google Sheet
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/, // Google Slides
    /id=([a-zA-Z0-9_-]+)/ // Fallback for other formats
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function checkDriveAccess(url: string): Promise<DriveCheckResult> {
  try {
    const fileId = extractFileId(url);
    if (!fileId) {
      return {
        isAccessible: false,
        isPublic: false,
        error: "Invalid Google Drive URL format"
      };
    }

    // Try to access the file without authentication
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
      }
    });

    // Check response headers and status for access level
    const isPublic = response.ok && !response.headers.get('www-authenticate');
    const contentType = response.headers.get('content-type') || '';
    
    // Google often redirects to sign-in page for private files
    const isSignInRedirect = response.redirected && 
                           (response.url.includes('accounts.google.com') || 
                            response.url.includes('sign-in'));

    if (isSignInRedirect) {
      return {
        isAccessible: false,
        isPublic: false,
        sharingLevel: "private",
        error: "This file requires Google sign-in. Please make it accessible to anyone with the link."
      };
    }

    if (!response.ok) {
      return {
        isAccessible: false,
        isPublic: false,
        sharingLevel: "restricted",
        error: `File is not accessible (Status: ${response.status})`
      };
    }

    // Additional check for preview availability
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const previewResponse = await fetch(previewUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
      }
    });

    const canPreview = previewResponse.ok && !previewResponse.headers.get('www-authenticate');

    return {
      isAccessible: true,
      isPublic: isPublic && canPreview,
      sharingLevel: isPublic && canPreview ? "public" : "restricted",
      error: isPublic && !canPreview ? 
        "File is accessible but preview is restricted. Consider adjusting sharing settings." : 
        undefined
    };
  } catch (error) {
    console.error('Error checking Drive access:', error);
    return {
      isAccessible: false,
      isPublic: false,
      sharingLevel: "restricted",
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await checkDriveAccess(url);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});