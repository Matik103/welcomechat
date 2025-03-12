import { supabase } from "@/integrations/supabase/client";

interface URLCheckResult {
  isAccessible: boolean;
  isCrawlable?: boolean;
  isScrapable?: boolean;
  isPublic?: boolean;
  sharingLevel?: "private" | "restricted" | "public";
  error?: string;
  lastChecked: string;
  nextCheckDue: string;
}

export const DEFAULT_REFRESH_RATES = {
  website: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  drive: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

const FUNCTION_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';

export async function checkWebsiteAccessibility(url: string): Promise<URLCheckResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const functionUrl = `${FUNCTION_BASE_URL}/check-url-access`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check URL accessibility');
    }

    const now = new Date();
    return {
      isAccessible: data.isAccessible,
      isCrawlable: data.isCrawlable,
      isScrapable: data.isScrapable,
      error: data.error || (!data.isCrawlable ? "URL cannot be crawled" : 
                          !data.isScrapable ? "URL cannot be scraped" : undefined),
      lastChecked: now.toISOString(),
      nextCheckDue: new Date(now.getTime() + DEFAULT_REFRESH_RATES.website).toISOString(),
    };
  } catch (error: any) {
    return {
      isAccessible: false,
      isCrawlable: false,
      isScrapable: false,
      error: error.message,
      lastChecked: new Date().toISOString(),
      nextCheckDue: new Date(Date.now() + DEFAULT_REFRESH_RATES.website).toISOString(),
    };
  }
}

export async function checkDriveAccessibility(url: string): Promise<URLCheckResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const functionUrl = `${FUNCTION_BASE_URL}/check-drive-access`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check Drive accessibility');
    }

    const now = new Date();
    return {
      isAccessible: data.isAccessible,
      isPublic: data.isPublic,
      sharingLevel: data.sharingLevel,
      error: data.error || (!data.isPublic ? "Drive file is not publicly accessible" : undefined),
      lastChecked: now.toISOString(),
      nextCheckDue: new Date(now.getTime() + DEFAULT_REFRESH_RATES.drive).toISOString(),
    };
  } catch (error: any) {
    return {
      isAccessible: false,
      isPublic: false,
      sharingLevel: "restricted",
      error: error.message,
      lastChecked: new Date().toISOString(),
      nextCheckDue: new Date(Date.now() + DEFAULT_REFRESH_RATES.drive).toISOString(),
    };
  }
}

export function shouldCheckURL(lastChecked: string | null, refreshRate: number): boolean {
  if (!lastChecked) return true;
  
  const lastCheckDate = new Date(lastChecked);
  const now = new Date();
  return now.getTime() - lastCheckDate.getTime() >= refreshRate;
}

export function getNextCheckDate(lastChecked: string | null, refreshRate: number): string {
  if (!lastChecked) return new Date().toISOString();
  
  const lastCheckDate = new Date(lastChecked);
  return new Date(lastCheckDate.getTime() + refreshRate).toISOString();
} 