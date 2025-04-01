import { LlamaParseConfig, LlamaParseRequest, LlamaParseResponse } from '@/types/llamaparse';
import fetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';

interface LlamaParseErrorResponse {
  message: string;
}

interface LlamaParseSuccessResponse {
  content: string;
  metadata: Record<string, any>;
  documentId?: string;
  status?: 'success' | 'error' | 'processing';
}

interface ProcessDocumentParams {
  file: File;
  metadata?: Record<string, any>;
}

interface ProcessDocumentResult {
  status: "success" | "error";
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export class LlamaParseService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LlamaParseConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.llamacloud.ai/v1';
  }

  private async makeRequest(endpoint: string, options: NodeFetchRequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.json() as LlamaParseErrorResponse;
      throw new Error(error.message || 'LlamaParse API request failed');
    }

    return response.json();
  }

  async processDocument(params: LlamaParseRequest): Promise<LlamaParseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: params.file,
      });

      if (!response.ok) {
        const errorData = await response.json() as LlamaParseErrorResponse;
        return {
          status: 'error',
          error: errorData.message || 'Failed to process document',
        };
      }

      const data = await response.json() as LlamaParseSuccessResponse;
      return {
        status: 'success',
        content: data.content,
        metadata: data.metadata,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getDocumentStatus(documentId: string): Promise<LlamaParseResponse> {
    try {
      const data = await this.makeRequest(`/documents/${documentId}`) as LlamaParseSuccessResponse;
      return {
        status: data.status === 'processing' ? 'success' : (data.status || 'success'),
        content: data.content,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Error getting document status:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/documents/${documentId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async listDocuments(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<LlamaParseResponse[]> {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());

      const data = await this.makeRequest(`/documents?${queryParams.toString()}`) as { documents: LlamaParseSuccessResponse[] };
      return data.documents.map((doc) => ({
        status: doc.status === 'processing' ? 'success' : (doc.status || 'success'),
        content: doc.content,
        metadata: doc.metadata,
      }));
    } catch (error) {
      console.error('Error listing documents:', error);
      throw error;
    }
  }
}
