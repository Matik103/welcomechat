
import { useEffect } from 'react';
import { testClientInvitation } from '@/services/clientService';
import { toast } from 'sonner';

const Index = () => {
  useEffect(() => {
    const runTest = async () => {
      try {
        const result = await testClientInvitation();
        console.log("Test result:", result);
        toast.success("Test invitation sent successfully!");
      } catch (error) {
        console.error("Test failed:", error);
        toast.error("Failed to send test invitation");
      }
    };
    
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to TestBot Assistant</h1>
        <p className="text-muted-foreground">
          Testing client invitation system...
        </p>
      </div>
    </div>
  );
};

export default Index;
