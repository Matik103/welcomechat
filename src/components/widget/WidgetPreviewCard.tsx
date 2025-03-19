
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { WidgetSettings } from "@/types/widget-settings";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewCardProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  return (
    <>
      <Card className="border-2 border-indigo-100 shadow-lg sticky top-6 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-indigo-700">Live Widget Preview</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreenOpen(true)}
              className="text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              <span className="text-xs">Expand</span>
            </Button>
          </div>
          <CardDescription>
            This is exactly how your widget will appear to your website visitors. 
            Click the chat icon to interact with a demo version powered by your actual content.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <WidgetPreview settings={settings} clientId={clientId} />
        </CardContent>
      </Card>

      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
          <div className="h-full bg-gray-50 flex items-center justify-center">
            <div className="relative w-full h-full max-w-3xl mx-auto">
              <WidgetPreview 
                settings={settings} 
                clientId={clientId} 
                fullscreen={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
