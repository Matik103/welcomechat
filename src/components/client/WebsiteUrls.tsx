
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Globe } from "lucide-react";
import { WebsiteUrl } from "@/types/client";
import { ActivityType, Json } from "@/integrations/supabase/types";

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteUrls = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  logActivity
}: WebsiteUrlsProps) => {
  const [newUrl, setNewUrl] = useState('');
  const [refreshRate, setRefreshRate] = useState(30);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    
    await onAdd({
      url: newUrl,
      refresh_rate: refreshRate
    });
    setNewUrl('');
  };
  
  const handleDelete = async (urlId: number) => {
    try {
      await logActivity("website_url_deleted", "Website URL deleted", { 
        url_id: urlId 
      });
      await onDelete(urlId);
    } catch (error) {
      console.error("Error deleting URL:", error);
    }
  };
  
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
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
        
        <Button type="submit" disabled={isAdding || !newUrl}>
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add URL
            </>
          )}
        </Button>
      </form>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Existing URLs</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No website URLs added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map((url) => (
              <div key={url.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <a 
                    href={url.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {url.url.length > 50 ? `${url.url.substring(0, 50)}...` : url.url}
                  </a>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(url.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
