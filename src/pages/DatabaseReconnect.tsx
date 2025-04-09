
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { verifySupabaseConnection, reinitializeAfterRestore } from "@/utils/supabaseReconnect";

interface ConnectionStatus {
  success: boolean;
  messages: string[];
  errors: string[];
  inProgress: boolean;
}

const DatabaseReconnect = () => {
  const [verificationStatus, setVerificationStatus] = useState<ConnectionStatus>({
    success: false,
    messages: [],
    errors: [],
    inProgress: false
  });
  
  const [reinitStatus, setReinitStatus] = useState<ConnectionStatus>({
    success: false,
    messages: [],
    errors: [],
    inProgress: false
  });

  const handleVerify = async () => {
    setVerificationStatus({
      success: false,
      messages: [],
      errors: [],
      inProgress: true
    });
    
    try {
      const results = await verifySupabaseConnection();
      setVerificationStatus({
        ...results,
        inProgress: false
      });
    } catch (error) {
      setVerificationStatus({
        success: false,
        messages: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        inProgress: false
      });
    }
  };

  const handleReinitialize = async () => {
    setReinitStatus({
      success: false,
      messages: [],
      errors: [],
      inProgress: true
    });
    
    try {
      const results = await reinitializeAfterRestore();
      setReinitStatus({
        ...results,
        inProgress: false
      });
    } catch (error) {
      setReinitStatus({
        success: false,
        messages: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        inProgress: false
      });
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Database Reconnection Utility</h1>
        <p className="text-gray-600">
          Use this utility to verify and reinitialize all connections after a database restore
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Connection Verification
            </CardTitle>
            <CardDescription>
              Verify your Supabase connection to ensure everything is working properly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationStatus.inProgress ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Verifying connections...</span>
              </div>
            ) : (
              <>
                {verificationStatus.messages.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Success Messages:</h3>
                    <ul className="space-y-1 pl-5 list-disc">
                      {verificationStatus.messages.map((msg, i) => (
                        <li key={i} className="text-green-600">{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verificationStatus.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Errors:</h3>
                    <ul className="space-y-1 pl-5 list-disc">
                      {verificationStatus.errors.map((err, i) => (
                        <li key={i} className="text-red-600">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verificationStatus.success !== undefined && !verificationStatus.inProgress && (
                  <Alert className={verificationStatus.success ? "bg-green-50" : "bg-red-50"}>
                    <div className="flex items-center">
                      {verificationStatus.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <AlertTitle>
                        {verificationStatus.success 
                          ? "All connections verified successfully" 
                          : "Connection verification failed"}
                      </AlertTitle>
                    </div>
                    <AlertDescription>
                      {verificationStatus.success 
                        ? "Your Supabase connection is working properly" 
                        : "Please fix the errors above and try again"}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleVerify} 
              disabled={verificationStatus.inProgress}
              className="w-full"
            >
              {verificationStatus.inProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                  Verifying...
                </>
              ) : "Verify Connections"}
            </Button>
          </CardFooter>
        </Card>

        {/* Reinitialization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 text-blue-500" />
              Database Reinitialization
            </CardTitle>
            <CardDescription>
              Reinitialize your Supabase resources after a database restore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertTitle>Use with caution</AlertTitle>
              <AlertDescription>
                This will attempt to reinitialize storage buckets, RPC functions, and more. 
                Run verification first to see what needs to be fixed.
              </AlertDescription>
            </Alert>

            {reinitStatus.inProgress ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Reinitializing connections...</span>
              </div>
            ) : (
              <>
                {reinitStatus.messages.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Success Messages:</h3>
                    <ul className="space-y-1 pl-5 list-disc">
                      {reinitStatus.messages.map((msg, i) => (
                        <li key={i} className="text-green-600">{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {reinitStatus.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Errors:</h3>
                    <ul className="space-y-1 pl-5 list-disc">
                      {reinitStatus.errors.map((err, i) => (
                        <li key={i} className="text-red-600">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {reinitStatus.success !== undefined && !reinitStatus.inProgress && reinitStatus.messages.length > 0 && (
                  <Alert className={reinitStatus.success ? "bg-green-50" : "bg-amber-50"}>
                    <div className="flex items-center">
                      {reinitStatus.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      )}
                      <AlertTitle>
                        {reinitStatus.success 
                          ? "Reinitialization completed" 
                          : "Reinitialization completed with warnings"}
                      </AlertTitle>
                    </div>
                    <AlertDescription>
                      {reinitStatus.success 
                        ? "All Supabase resources have been reinitialized" 
                        : "Some resources could not be reinitialized. Check the errors above."}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleReinitialize} 
              variant="destructive"
              disabled={reinitStatus.inProgress}
              className="w-full"
            >
              {reinitStatus.inProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                  Reinitializing...
                </>
              ) : "Reinitialize Supabase Resources"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseReconnect;
