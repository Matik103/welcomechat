
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StorageBucketViewer } from '@/components/admin/StorageBucketViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCheckAdmin } from '@/hooks/useCheckAdmin';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function StorageBrowserPage() {
  const { isAdmin, isLoading: isCheckingAdmin } = useCheckAdmin();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect if not admin
    if (!isCheckingAdmin && !isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  if (isCheckingAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null; // Redirecting to auth page
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Storage Bucket Browser</h1>
        
        <Tabs defaultValue="document-storage">
          <TabsList className="mb-4">
            <TabsTrigger value="document-storage">Document Storage</TabsTrigger>
            <TabsTrigger value="client-documents">Client Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document-storage">
            <StorageBucketViewer />
          </TabsContent>
          
          <TabsContent value="client-documents">
            <p className="text-center py-8 text-muted-foreground">
              Client Documents browser not implemented yet. 
              This tab is reserved for browsing the "Client Documents" bucket.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
