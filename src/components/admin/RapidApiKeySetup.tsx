import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RAPIDAPI_KEY } from '@/config/env';

interface RapidApiKeySetupProps {
  onKeyConfigured?: () => void;
}

export function RapidApiKeySetup({ onKeyConfigured }: RapidApiKeySetupProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    setIsLoading(true);
    try {
      // Try to get the key from env variables first (for local development)
      if (RAPIDAPI_KEY) {
        setApiKey(RAPIDAPI_KEY);
        if (onKeyConfigured) onKeyConfigured();
        return;
      }
      
      // Otherwise, check Supabase secrets
      const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-secrets', {
        body: { keys: ['VITE_RAPIDAPI_KEY'] }
      });
      
      if (secretsError) {
        throw new Error(`Failed to fetch API key: ${secretsError.message}`);
      }
      
      if (secrets?.VITE_RAPIDAPI_KEY) {
        setApiKey(secrets.VITE_RAPIDAPI_KEY);
        if (onKeyConfigured) onKeyConfigured();
      }
    } catch (error) {
      console.error('Error checking for RapidAPI key:', error);
      toast.error('Failed to check RapidAPI key status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    setIsSaving(true);
    try {
      // Store the key in Supabase secrets
      const { error: setSecretError } = await supabase.functions.invoke('set-secrets', {
        body: { 
          secrets: {
            VITE_RAPIDAPI_KEY: newApiKey.trim()
          }
        }
      });
      
      if (setSecretError) {
        throw new Error(`Failed to save API key: ${setSecretError.message}`);
      }
      
      toast.success('RapidAPI key saved successfully');
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      
      if (onKeyConfigured) onKeyConfigured();
    } catch (error) {
      console.error('Error saving RapidAPI key:', error);
      toast.error('Failed to save RapidAPI key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking RapidAPI Configuration</CardTitle>
          <CardDescription>Verifying PDF text extraction capabilities</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Checking API key configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apiKey) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <KeyRound className="h-5 w-5" />
            RapidAPI Key Configured
          </CardTitle>
          <CardDescription className="text-green-600">
            PDF text extraction is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Your RapidAPI key for PDF text extraction is properly configured.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="text-green-700 border-green-300 hover:bg-green-100"
            onClick={() => setApiKey(null)}
          >
            Update API Key
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          RapidAPI Key Required
        </CardTitle>
        <CardDescription>
          PDF text extraction requires a RapidAPI key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">API Key Missing</AlertTitle>
          <AlertDescription className="text-amber-700">
            To process PDF documents, you need to add a RapidAPI key for the PDF to Text Converter API.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Follow these steps to get your API key:
          </p>
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>Visit the <a href="https://rapidapi.com/developer/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 inline-block">RapidAPI Dashboard <ExternalLink className="h-3 w-3 inline" /></a></li>
            <li>Subscribe to the <a href="https://rapidapi.com/peresagroup-peresagroup-default/api/pdf-to-text-converter" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 inline-block">PDF to Text Converter API <ExternalLink className="h-3 w-3 inline" /></a></li>
            <li>Copy your API key from the dashboard</li>
            <li>Paste it in the field below</li>
          </ol>
        </div>
        
        <div className="pt-2">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            RapidAPI Key
          </label>
          <div className="flex gap-2">
            <input
              id="apiKey"
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Enter your RapidAPI key"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button 
              onClick={handleSaveApiKey} 
              disabled={isSaving || !newApiKey.trim()} 
              className="whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save API Key'}
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your API key will be securely stored in your Supabase environment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
