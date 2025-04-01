
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { FirecrawlService } from '@/services/FirecrawlService';

export function FirecrawlConfigForm() {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if API key is already configured
  useEffect(() => {
    const checkConfig = async () => {
      // First check for environment variable
      const envApiKey = window.ENV?.VITE_FIRECRAWL_API_KEY;
      if (envApiKey) {
        setIsConfigured(true);
        return;
      }

      // Then check for local storage
      const storedApiKey = localStorage.getItem('firecrawl_api_key');
      if (storedApiKey) {
        setApiKey(storedApiKey);
        setIsConfigured(true);
      }
    };

    checkConfig();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      // Verify the API key by making a test request
      const verifyResult = await FirecrawlService.verifyFirecrawlConfig(apiKey);
      
      if (verifyResult.success) {
        // Save API key to local storage
        localStorage.setItem('firecrawl_api_key', apiKey);
        setIsConfigured(true);
        toast.success('Firecrawl API key configured successfully');
      } else {
        toast.error(`Failed to verify API key: ${verifyResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Error configuring API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfig = () => {
    localStorage.removeItem('firecrawl_api_key');
    setApiKey('');
    setIsConfigured(false);
    toast.success('Firecrawl configuration reset');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Firecrawl Configuration</CardTitle>
        <CardDescription>
          Configure your Firecrawl API key to enable website crawling functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigured ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 font-medium">✓ Firecrawl API is configured</p>
              <p className="text-sm text-green-600 mt-1">
                {window.ENV?.VITE_FIRECRAWL_API_KEY 
                  ? 'Using API key from environment variables' 
                  : 'Using locally stored API key'}
              </p>
            </div>
            <Button variant="outline" onClick={handleResetConfig}>
              Reset Configuration
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="Enter your Firecrawl API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveApiKey} disabled={isLoading || !apiKey.trim()}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Get your API key from <a 
                  href="https://firecrawl.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  firecrawl.dev
                </a>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
