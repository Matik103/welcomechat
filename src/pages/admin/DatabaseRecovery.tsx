
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { restoreDeletedTables } from '@/utils/restoreTables';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';

export default function DatabaseRecoveryPage() {
  const [isRestoring, setIsRestoring] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const handleRestoreTables = async () => {
    try {
      setIsRestoring(true);
      setResult(null);
      
      const success = await restoreDeletedTables();
      
      setResult({
        success,
        message: success 
          ? 'Database tables have been successfully restored!' 
          : 'There was an issue restoring some tables. Please check the console for details.'
      });
    } catch (error) {
      console.error('Error in restoration process:', error);
      setResult({
        success: false,
        message: `Restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Recovery</h1>
        
        <Tabs defaultValue="restore">
          <TabsList className="mb-4">
            <TabsTrigger value="restore">Table Restoration</TabsTrigger>
            <TabsTrigger value="info">Recovery Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restore">
            <Card>
              <CardHeader>
                <CardTitle>Restore Deleted Tables</CardTitle>
                <CardDescription>
                  This will recreate essential database tables that were accidentally deleted.
                  This includes: ai_agents, document_content, assistant_documents, website_urls, and client_activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result && (
                  <Alert className={result.success ? "bg-green-50 border-green-200 mb-4" : "bg-red-50 border-red-200 mb-4"}>
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                )}
                
                <p className="text-gray-700 mb-4">
                  This process will attempt to recreate the database structure based on schema definitions in the project.
                  Note that this will only restore the table structures, not the data that was in them.
                </p>
                
                <Separator className="my-4" />
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <p className="font-medium text-amber-800">Important Note:</p>
                  <p className="text-amber-700 text-sm mt-1">
                    This restoration will recreate empty tables. Any data that was in these tables before deletion
                    will not be recovered. If you need to recover the actual data, you'll need to restore from a database backup.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleRestoreTables} 
                  disabled={isRestoring}
                  size="lg"
                >
                  {isRestoring ? (
                    <>
                      <Spinner className="mr-2" />
                      Restoring Tables...
                    </>
                  ) : "Restore Database Tables"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Recovery Information</CardTitle>
                <CardDescription>
                  Additional information about database recovery options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-medium mb-2">Tables Being Restored</h3>
                <ul className="list-disc list-inside mb-4 ml-2">
                  <li><strong>ai_agents</strong> - Stores agent configurations and client information</li>
                  <li><strong>document_content</strong> - Stores document content data</li>
                  <li><strong>assistant_documents</strong> - Maps documents to assistants</li>
                  <li><strong>website_urls</strong> - Stores website URLs for scraping</li>
                  <li><strong>client_activities</strong> - Stores client activity logs</li>
                </ul>
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium mb-2">Next Steps After Restoration</h3>
                <p className="text-gray-700 mb-2">
                  After restoring the tables, you may need to:
                </p>
                <ol className="list-decimal list-inside mb-4 ml-2">
                  <li>Re-create any Row Level Security policies that were in place</li>
                  <li>Re-establish foreign key relationships between tables</li>
                  <li>Re-add any indexes for performance optimization</li>
                  <li>Reimport data if you have backups available</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
