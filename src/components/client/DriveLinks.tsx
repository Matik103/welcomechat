
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Upload, Link, FileQuestion, AlertTriangle } from "lucide-react";
import { AccessStatus, DocumentLink } from "@/types/client";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import { ActivityType, Json } from "@/integrations/supabase/types";

interface DriveLinksProps {
  driveLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  onDelete: (linkId: number) => Promise<void>;
  onUpload: (data: { file: File; agentName: string }) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

// Drive Link Form component
const DriveLinkForm = ({ onAdd, isAdding }: {
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  isAdding: boolean;
}) => {
  const [link, setLink] = useState('');
  const [refreshRate, setRefreshRate] = useState(30);
  const [documentType, setDocumentType] = useState('google_drive');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    
    await onAdd({ link, refresh_rate: refreshRate, document_type: documentType });
    setLink('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link">Drive Link</Label>
        <Input
          id="link"
          placeholder="Paste a Google Drive link here"
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
        <Select value={String(refreshRate)} onValueChange={(value) => setRefreshRate(Number(value))}>
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
  );
};

// Drive Links List component
const DriveLinksList = ({ 
  driveLinks, 
  onDelete, 
  isDeleting,
  logActivity
}: {
  driveLinks: DocumentLink[];
  onDelete: (linkId: number) => Promise<void>;
  isDeleting: boolean;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}) => {
  const handleDelete = async (linkId: number) => {
    if (isDeleting) return;
    
    try {
      await logActivity(
        "document_link_deleted", 
        `Document link deleted`, 
        { link_id: linkId }
      );
      await onDelete(linkId);
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  if (driveLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500">No document links added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {driveLinks.map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          onDelete={() => handleDelete(link.id)}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
};

// Link Item component
const LinkItem = ({ 
  link, 
  onDelete, 
  isDeleting 
}: {
  link: DocumentLink;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}) => {
  const { accessStatus } = useDriveAccessCheck(link.id);
  
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
    if (status === 'accessible') {
      return null;
    }
    if (status === 'inaccessible') {
      return <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />;
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex items-center space-x-2">
        <Link className="h-5 w-5 text-blue-600" />
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
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
      </Button>
    </div>
  );
};

// File uploader component
const FileUploader = ({ 
  onUpload, 
  isUploading, 
  agentName,
  logActivity 
}: {
  onUpload: (data: { file: File; agentName: string }) => Promise<void>;
  isUploading: boolean;
  agentName: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}) => {
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    try {
      await logActivity(
        "document_uploaded", 
        `Document uploaded: ${file.name}`, 
        { 
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        }
      );
      
      await onUpload({ 
        file: file, 
        agentName: agentName
      });
      
      setFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Upload PDF Document</Label>
        <Input 
          id="file" 
          type="file" 
          accept=".pdf,.docx,.doc,.txt" 
          onChange={handleFileChange}
          required
        />
        <p className="text-xs text-gray-500">
          Maximum file size: 10MB. Supported formats: PDF, DOCX, DOC, TXT
        </p>
      </div>
      
      <Button type="submit" disabled={isUploading || !file}>
        {isUploading ? (
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
  );
};

// Main DriveLinks component
export const DriveLinks = ({
  driveLinks,
  onAdd,
  onDelete,
  onUpload,
  isLoading,
  isAdding,
  isDeleting,
  agentName,
  logActivity
}: DriveLinksProps) => {
  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="links" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="links">Google Drive Links</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="links" className="p-6">
          <div className="space-y-6">
            <DriveLinkForm onAdd={onAdd} isAdding={isAdding} />
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Existing Links</h3>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DriveLinksList 
                  driveLinks={driveLinks} 
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                  logActivity={logActivity}
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="p-6">
          <FileUploader 
            onUpload={onUpload} 
            isUploading={isAdding} 
            agentName={agentName}
            logActivity={logActivity}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
