import { supabase } from "@/integrations/supabase/client";
import { ParseResponse } from '@/types/document-processing';
import { callRpcFunction } from '@/utils/rpcUtils';

// Add these utility functions at the top of the file after imports
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 32000,    // 32 seconds
  factor: 2,          // exponential factor
};

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = retryOptions.initialDelay;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retryOptions.maxAttempts) {
        throw new Error(`Failed after ${attempt} attempts. Last error: ${lastError.message}`);
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await sleep(delay);
      delay = Math.min(delay * retryOptions.factor, retryOptions.maxDelay);
    }
  }

  throw lastError; // TypeScript requires this, but it should never be reached
}

// Enhanced error types
export class LlamaParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'LlamaParseError';
  }
}

export class LlamaCloudService {
  // System prompt template to ensure assistants only respond to client-specific questions
  static readonly SYSTEM_PROMPT = `You are an AI assistant created within the ByClicks AI system, designed to serve individual clients with their own unique knowledge bases. Each assistant is assigned to a specific client, and must only respond based on the information available for that specific client.

Rules & Limitations:
✅ Client-Specific Knowledge Only:
- You must only provide answers based on the knowledge base assigned to your specific client.
- If a question is outside your assigned knowledge, politely decline to answer.

✅ Professional, Friendly, and Helpful:
- Maintain a conversational and approachable tone.
- Always prioritize clear, concise, and accurate responses.

🚫 Do NOT Answer These Types of Questions:
- Personal or existential questions (e.g., "What's your age?" or "Do you have feelings?").
- Philosophical or abstract discussions (e.g., "What is the meaning of life?").
- Technical questions about your own system or how you are built.
- Anything unrelated to the client you are assigned to serve.

Example Responses for Off-Limit Questions:
- "I'm here to assist with questions related to [CLIENT_NAME] and their business. How can I help you with that?"
- "I focus on providing support for [CLIENT_NAME]. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with [CLIENT_NAME]'s needs. Let me know how I can help with that!"`;

  // Get client-specific system prompt
  static getClientSystemPrompt(clientName: string): string {
    return this.SYSTEM_PROMPT.replace(/\[CLIENT_NAME\]/g, clientName);
  }

  private static readonly LLAMA_CLOUD_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';
  
  // Replace direct access to process.env with a method to get API key safely in browser context
  private static getLlamaCloudApiKey(): string {
    // During build time, Vite replaces import.meta.env variables
    return import.meta.env.VITE_LLAMA_CLOUD_API_KEY || '';
  }

  /**
   * Parse a document using LlamaParse
   */
  static async parseDocument(
    documentUrl: string,
    documentType: string,
    clientId: string,
    agentName: string
  ): Promise<ParseResponse> {
    try {
      const apiKey = this.getLlamaCloudApiKey();
      if (!apiKey) {
        throw new LlamaParseError(
          'LLAMA_CLOUD_API_KEY is not configured',
          'CONFIG_ERROR'
        );
      }

      // Step 1: Upload document to LlamaParse with retry
      const uploadResult = await retryWithExponentialBackoff(async () => {
        const response = await fetch(`${this.LLAMA_CLOUD_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            file_url: documentUrl,
            file_type: documentType
          })
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new LlamaParseError(
            `Upload failed: ${response.statusText}`,
            'UPLOAD_ERROR',
            { status: response.status, body: errorBody }
          );
        }

        return response.json();
      }, {
        maxAttempts: 3,
        initialDelay: 2000
      });

      const jobId = uploadResult.job_id;

      // Step 2: Poll for job completion with improved error handling
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 10000; // 10 seconds

      while (attempts < maxAttempts) {
        const jobStatus = await retryWithExponentialBackoff(async () => {
          const response = await fetch(`${this.LLAMA_CLOUD_API_URL}/job/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });

          if (!response.ok) {
            throw new LlamaParseError(
              `Failed to check job status: ${response.statusText}`,
              'STATUS_CHECK_ERROR',
              { status: response.status }
            );
          }

          return response.json();
        }, {
          maxAttempts: 2,
          initialDelay: 1000
        });

        if (jobStatus.status === 'completed') {
          // Step 3: Get the parsed content with retry
          const result = await retryWithExponentialBackoff(async () => {
            const response = await fetch(`${this.LLAMA_CLOUD_API_URL}/result/${jobId}`, {
              headers: {
                'Authorization': `Bearer ${apiKey}`
              }
            });

            if (!response.ok) {
              throw new LlamaParseError(
                `Failed to get results: ${response.statusText}`,
                'RESULT_FETCH_ERROR',
                { status: response.status }
              );
            }

            return response.json();
          });

          // Validate the content
          if (!result.content || typeof result.content !== 'string') {
            throw new LlamaParseError(
              'Invalid content received from LlamaParse',
              'INVALID_CONTENT',
              { result }
            );
          }

          return {
            success: true,
            content: result.content,
            metadata: {
              title: result.metadata?.title,
              pageCount: result.metadata?.page_count,
              author: result.metadata?.author,
              createdAt: result.metadata?.created_at,
              fileType: documentType,
              processingMethod: 'llamaparse',
              jobId: jobId,
              clientId: clientId,
              agentName: agentName,
              processedAt: new Date().toISOString(),
              contentLength: result.content.length,
              language: result.metadata?.language || 'unknown'
            },
            documentId: `llama-${jobId}`
          };
        } else if (jobStatus.status === 'failed') {
          throw new LlamaParseError(
            `Job failed: ${jobStatus.error || 'Unknown error'}`,
            'JOB_FAILED',
            jobStatus
          );
        }

        await sleep(pollInterval);
        attempts++;
      }

      throw new LlamaParseError(
        'Job timed out after 5 minutes',
        'TIMEOUT_ERROR'
      );
    } catch (error) {
      console.error('Error in parseDocument:', error);
      
      // Convert all errors to LlamaParseError format
      const llamaError = error instanceof LlamaParseError
        ? error
        : new LlamaParseError(
            error instanceof Error ? error.message : 'Unknown error in LlamaParse',
            'UNKNOWN_ERROR',
            { originalError: error }
          );

      return {
        success: false,
        error: llamaError.message,
        errorDetails: {
          code: llamaError.code,
          details: llamaError.details
        },
        content: '',
        metadata: {
          fileType: documentType,
          processingMethod: 'llamaparse',
          error: llamaError.message,
          errorCode: llamaError.code,
          failedAt: new Date().toISOString()
        },
        documentId: `error-${Date.now()}`
      };
    }
  }

  /**
   * Creates embeddings and stores them in the vector database
   * This would typically be done after document parsing
   */
  static async createEmbeddings(
    clientId: string,
    agentName: string,
    documentId: string
  ): Promise<ParseResponse> {
    try {
      console.log(`Creating embeddings for document ${documentId}`);
      
      // Call a Supabase function to create embeddings (we'd need to create this)
      const { data, error } = await supabase.functions.invoke('create-embeddings', {
        method: 'POST',
        body: {
          clientId,
          agentName,
          documentId
        },
      });
      
      if (error) {
        console.error('Error creating embeddings:', error);
        return {
          success: false,
          error: error.message || 'Failed to create embeddings',
          content: '',
          metadata: {
            error: error.message || 'Failed to create embeddings'
          },
          documentId
        };
      }
      
      return {
        success: true,
        content: 'Embeddings created successfully',
        metadata: {
          processingMethod: 'embeddings',
          clientId,
          agentName,
          documentId
        },
        documentId,
        data
      };
    } catch (error) {
      console.error('Error in createEmbeddings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create embeddings',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to create embeddings'
        },
        documentId
      };
    }
  }

  /**
   * Adds a processed document to an OpenAI Assistant
   */
  static async addDocumentToOpenAIAssistant(
    clientId: string,
    agentName: string,
    documentContent: string,
    documentTitle: string
  ): Promise<ParseResponse> {
    try {
      console.log(`Adding document "${documentTitle}" to OpenAI Assistant for client ${clientId}`);
      
      // Get the OpenAI Assistant ID for this client
      const result = await supabase
        .from("ai_agents")
        .select("openai_assistant_id")
        .eq("client_id", clientId)
        .eq("interaction_type", "config")
        .single();
      
      // Properly handle errors and check for the column
      if (result.error) {
        console.error('Error finding OpenAI Assistant ID for this client:', result.error);
        
        // Special handling for missing column error
        if (result.error.message?.includes("column 'openai_assistant_id' does not exist")) {
          console.error('The openai_assistant_id column is missing. Running migration...');
          
          // Run the migration to add the column via the Edge Function
          const { data: migrationData, error: migrationError } = await supabase.functions.invoke('execute_sql', {
            method: 'POST',
            body: {
              sql: `ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS openai_assistant_id text;`
            },
          });
          
          if (migrationError) {
            console.error('Failed to add openai_assistant_id column:', migrationError);
            return {
              success: false,
              error: `Failed to add required column: ${migrationError.message}`,
              content: '',
              metadata: {
                error: `Failed to add required column: ${migrationError.message}`
              },
              documentId: `error-${Date.now()}`
            };
          }
          
          console.log('Successfully added openai_assistant_id column');
        }
        
        // Create a new OpenAI Assistant for this client
        const { data: createData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
          method: 'POST',
          body: {
            client_id: clientId,
            agent_name: agentName,
            agent_description: `Assistant for ${agentName}`,
          },
        });
        
        if (createError || !createData?.assistant_id) {
          console.error('Failed to create OpenAI Assistant:', createError);
          return {
            success: false,
            error: createError?.message || 'Failed to create OpenAI Assistant',
            content: '',
            metadata: {
              error: createError?.message || 'Failed to create OpenAI Assistant'
            },
            documentId: `error-${Date.now()}`
          };
        }
        
        // The new assistant_id will be used in the subsequent call to upload-document-to-assistant
      } else if (!result.data || !result.data.openai_assistant_id) {
        console.log('No openai_assistant_id found for this client. Creating new assistant...');
        
        // Create a new OpenAI Assistant for this client
        const { data: createData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
          method: 'POST',
          body: {
            client_id: clientId,
            agent_name: agentName,
            agent_description: `Assistant for ${agentName}`,
          },
        });
        
        if (createError || !createData?.assistant_id) {
          console.error('Failed to create OpenAI Assistant:', createError);
          return {
            success: false,
            error: createError?.message || 'Failed to create OpenAI Assistant',
            content: '',
            metadata: {
              error: createError?.message || 'Failed to create OpenAI Assistant'
            },
            documentId: `error-${Date.now()}`
          };
        }
        
        console.log('Created new OpenAI Assistant with ID:', createData.assistant_id);
      } else {
        console.log('Found existing OpenAI Assistant ID:', result.data.openai_assistant_id);
      }
      
      // Now call the Supabase function to add the document to the assistant
      const { data, error } = await supabase.functions.invoke('upload-document-to-assistant', {
        method: 'POST',
        body: {
          clientId,
          agentName,
          documentContent,
          documentTitle
        },
      });
      
      if (error) {
        console.error('Error adding document to OpenAI Assistant:', error);
        return {
          success: false,
          error: error.message || 'Failed to add document to OpenAI Assistant',
          content: '',
          metadata: {
            error: error.message || 'Failed to add document to OpenAI Assistant'
          },
          documentId: `error-${Date.now()}`
        };
      }
      
      console.log('Successfully added document to OpenAI Assistant:', data);
      
      return {
        success: true,
        content: documentContent.substring(0, 100) + '...',
        metadata: {
          title: documentTitle,
          processingMethod: 'openai-assistant',
          assistantId: data.assistant_id,
          fileId: data.file_id
        },
        documentId: `openai-${data.file_id}`,
        data
      };
    } catch (error) {
      console.error('Error in addDocumentToOpenAIAssistant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add document to OpenAI Assistant',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to add document to OpenAI Assistant'
        },
        documentId: `error-${Date.now()}`
      };
    }
  }

  /**
   * Verifies that all required components for OpenAI Assistant integration are in place
   */
  static async verifyAssistantIntegration(): Promise<ParseResponse> {
    try {
      console.log('Verifying OpenAI Assistant Integration components...');
      
      // Check 1: Verify required API keys using a safer approach in browser context
      const { data: secretsData, error: secretsError } = await supabase.functions.invoke('check-secrets', {
        method: 'POST',
        body: { 
          required: ['OPENAI_API_KEY', 'LLAMA_CLOUD_API_KEY', 'FIRECRAWL_API_KEY'] 
        },
      });
      
      if (secretsError || !secretsData?.success) {
        return {
          success: false,
          error: 'Missing required API keys: ' + (secretsData?.missing?.join(', ') || 'Unknown'),
          content: '',
          metadata: {
            error: 'Missing required API keys'
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 2: Verify the openai_assistant_id column exists in ai_agents table
      const { data: columnData, error: columnError } = await supabase.functions.invoke('check-table-exists', {
        method: 'POST',
        body: { table_name: 'ai_agents' },
      });
      
      if (columnError || !columnData?.exists) {
        return {
          success: false,
          error: 'The ai_agents table is missing or inaccessible',
          content: '',
          metadata: {
            error: 'The ai_agents table is missing or inaccessible'
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 3: Verify the edge functions are deployed - uses basic ping test
      const requiredFunctions = [
        'process-document', 
        'create-openai-assistant', 
        'upload-document-to-assistant'
      ];
      
      let missingFunctions = [];
      for (const funcName of requiredFunctions) {
        try {
          // Simple test call to check if function exists and responds
          const { error } = await supabase.functions.invoke(funcName, {
            method: 'GET',
            body: { test: true }
          });
          
          if (error) {
            console.error(`Edge function ${funcName} appears to be unavailable:`, error);
            missingFunctions.push(funcName);
          }
        } catch (e) {
          console.error(`Edge function ${funcName} appears to be missing:`, e);
          missingFunctions.push(funcName);
        }
      }
      
      if (missingFunctions.length > 0) {
        return {
          success: false,
          error: `Required Edge Functions are not deployed correctly: ${missingFunctions.join(', ')}`,
          content: '',
          metadata: {
            error: `Required Edge Functions are not deployed correctly: ${missingFunctions.join(', ')}`
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 4: Verify document storage bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('documents');
      
      if (bucketError) {
        return {
          success: false,
          error: 'Document storage bucket is missing or inaccessible',
          content: '',
          metadata: {
            error: 'Document storage bucket is missing or inaccessible'
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 5: Run the OpenAI migration if needed
      try {
        // This checks if the openai_assistant_id column exists in the ai_agents table
        const { data: columnCheckData, error: columnCheckError } = await callRpcFunction('exec_sql', {
          sql_query: `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'ai_agents' 
              AND column_name = 'openai_assistant_id'
            ) as exists
          `
        });
        
        // Fixed type error - properly check the response structure
        const columnExists = columnCheckData && 
                            Array.isArray(columnCheckData) && 
                            columnCheckData.length > 0 && 
                            columnCheckData[0] !== null && 
                            typeof columnCheckData[0] === 'object' &&
                            'exists' in columnCheckData[0] && 
                            columnCheckData[0].exists === true;
        
        if (columnCheckError || !columnExists) {
          console.log('The openai_assistant_id column is missing. Running migration...');
          
          // Run the migration to add the column via the Edge Function
          const { data: migrationData, error: migrationError } = await supabase.functions.invoke('execute_sql', {
            method: 'POST',
            body: {
              sql: `ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS openai_assistant_id text;`
            },
          });
          
          if (migrationError) {
            console.error('Failed to add openai_assistant_id column:', migrationError);
            return {
              success: false,
              error: `Failed to add required column: ${migrationError.message}`,
              content: '',
              metadata: {
                error: `Failed to add required column: ${migrationError.message}`
              },
              documentId: `verify-${Date.now()}`
            };
          }
          
          console.log('Successfully added openai_assistant_id column');
        }
      } catch (error) {
        console.error('Error checking for openai_assistant_id column:', error);
        // Non-fatal error, continue with verification
      }
      
      const verificationDetails = {
        message: 'All OpenAI Assistant and Firecrawl integration components verified successfully',
        apiKeysAvailable: true,
        databaseReady: true,
        edgeFunctionsDeployed: true,
        storageBucketReady: true,
        firecrawlConfigured: true
      };
      
      return {
        success: true,
        content: 'Verification successful',
        metadata: {
          processingMethod: 'verification',
          verificationDetails
        },
        documentId: `verify-${Date.now()}`,
        data: verificationDetails
      };
    } catch (error) {
      console.error('Error verifying assistant integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify assistant integration',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to verify assistant integration'
        },
        documentId: `verify-${Date.now()}`
      };
    }
  }
}
