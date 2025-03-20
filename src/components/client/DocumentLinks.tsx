
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Upload, 
  Link as LinkIcon, 
  FileQuestion, 
  AlertTriangle 
} from "lucide-react";
import { ActivityType, Json } from '@/integrations/supabase/types';
import { AccessStatus, DocumentLink } from '@/types/client';
import { useDriveAccessCheck } from '@/hooks/useDriveAccessCheck';
import { execSql } from '@/utils/rpcUtils';

interface DocumentLinksProps {
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  onDelete: (linkId: number) => Promise<void>;
  onUpload: (file: File, agentName: string) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
  clientId: string;
}

export const DocumentLinks = ({
  onAdd,
  onDelete,
  onUpload,
  isLoading,
  isAdding,
  isDeleting,
  agentName,
  logActivity,
  clientId
}: DocumentLinksProps) => {
  const [links, setLinks] = useState<DocumentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("links");
  
  // Fetch document links
  const fetchLinks = async () => {
    try {
      setLoading(true);
      // Use SQL query via RPC to get document links
      const sql = `
        SELECT * FROM document_links
        WHERE client_id = $1
        ORDER BY created_at DESC
      `;
      
      const data = await execSql(sql, { client_id: clientId });
      
      if (Array.isArray(data)) {
        setLinks(data as DocumentLink[]);
      } else {
        setLinks([]);
      }
    } catch (error) {
      console.error("Error fetching document links:", error);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize component
  useState(() => {
    fetchLinks();
  });
  
  // Form state
  const [link, setLink] = useState("");
  const [refreshRate, setRefreshRate] = useState(30);
  const [documentType, setDocumentType] = useState<string>("google_drive");
  const [file, setFile] = useState<File | null>(null);
  
  // Handle form submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    
    try {
      await onAdd({ link, refresh_rate: refreshRate, document_type: documentType });
      setLink("");
      fetchLinks(); // Refresh the list
    } catch (error) {
      console.error("Error adding document link:", error);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    try {
      await onUpload(file, agentName);
      setFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="links">Document Links</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="links" className="p-6">
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link">Document Link</Label>
              <Input
                id="link"
                placeholder="Paste a Google Drive or document link here"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive Folder</SelectItem>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="google_sheet">Google Sheet</SelectItem>
                  <SelectItem value="text">Text Document</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refreshRate">Refresh Interval (days)</Label>
              <Select 
                value={String(refreshRate)} 
                onValueChange={(value) => setRefreshRate(Number(value))}
              >
                <SelectTrigger id="refreshRate">
                  <SelectValue placeholder="Select refresh interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isAdding || !link}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Link
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Your Document Links</h3>
            {isLoading || loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No document links added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <LinkItem
                    key={link.id}
                    link={link}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                    logActivity={logActivity}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="p-6">
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <Input 
                id="file" 
                type="file" 
                accept=".pdf,.docx,.doc,.txt" 
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                required
              />
              <p className="text-xs text-gray-500">
                Maximum file size: 10MB. Supported formats: PDF, DOCX, DOC, TXT
              </p>
            </div>
            
            <Button type="submit" disabled={isAdding || !file}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Link item component for displaying individual document links
interface LinkItemProps {
  link: DocumentLink;
  onDelete: (linkId: number) => Promise<void>;
  isDeleting: boolean;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

const LinkItem = ({ link, onDelete, isDeleting, logActivity }: LinkItemProps) => {
  const { accessStatus } = useDriveAccessCheck(link.id);
  
  const handleDelete = async () => {
    try {
      await logActivity(
        "document_link_deleted", 
        `Document link deleted: ${link.link}`, 
        { 
          link_id: link.id,
          document_type: link.document_type
        }
      );
      await onDelete(link.id);
    } catch (error) {
      console.error("Error deleting document link:", error);
    }
  };
  
  // Determine colors and icons based on access status
  const getAccessStatusColor = (status: AccessStatus) => {
    switch (status) {
      case 'accessible':
        return 'text-green-600';
      case 'inaccessible':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getAccessStatusIcon = (status: AccessStatus) => {
    if (status === 'inaccessible') {
      return <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />;
    }
    return null;
  };
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex items-center space-x-2">
        <LinkIcon className="h-5 w-5 text-blue-600" />
        <div>
          <a 
            href={link.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            {link.link.length > 50 ? `${link.link.substring(0, 50)}...` : link.link}
          </a>
          <div className="flex items-center">
            <span className={`text-xs ${getAccessStatusColor(accessStatus)}`}>
              Status: {accessStatus === 'unknown' ? 'Checking...' : accessStatus}
            </span>
            {getAccessStatusIcon(accessStatus)}
          </div>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
      </Button>
    </div>
  );
};
