
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DocumentProcessingResult } from '@/types/document-processing';
import { checkDocumentProcessingStatus } from '@/services/documentProcessingService';

export const useDocumentProcessor = (onProcessingComplete?: () => void) => {
  const [activeJobs, setActiveJobs] = useState<string[]>([]);
  const [processingStatus, setProcessingStatus] = useState<Record<string, DocumentProcessingResult>>({});

  // Check the status of a document processing job
  const checkStatus = useMutation({
    mutationFn: (jobId: string) => checkDocumentProcessingStatus(jobId),
    onSuccess: (result, jobId) => {
      setProcessingStatus(prev => ({
        ...prev,
        [jobId]: result
      }));

      // If job completed or failed, remove from active jobs
      if (result.success || (result.error && result.error.length > 0)) {
        setActiveJobs(prev => prev.filter(id => id !== jobId));
        
        // Notify caller that processing is complete
        if (onProcessingComplete) {
          onProcessingComplete();
        }

        if (result.success) {
          toast.success(`Document processed successfully: ${result.processed} items processed`);
        } else if (result.error) {
          toast.error(`Document processing failed: ${result.error}`);
        }
      }
    }
  });

  // Add a job to be monitored
  const addJob = (jobId: string) => {
    if (jobId && !activeJobs.includes(jobId)) {
      setActiveJobs(prev => [...prev, jobId]);
    }
  };

  // Poll for status updates for active jobs
  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      activeJobs.forEach(jobId => {
        checkStatus.mutate(jobId);
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [activeJobs]);

  return {
    addJob,
    processingStatus,
    isProcessing: activeJobs.length > 0,
    activeJobs
  };
};
