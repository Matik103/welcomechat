import { renderHook } from '@testing-library/react';
import { useUnifiedDocumentUpload } from '../src/hooks/useUnifiedDocumentUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';

// Mock environment variables
vi.stubGlobal('process', {
  env: {
    VITE_RAPIDAPI_KEY: 'test-api-key',
    VITE_RAPIDAPI_HOST: 'pdf-to-text-api.p.rapidapi.com'
  }
});

// Mock fetch for RapidAPI calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase client
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } })
      })
    },
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: { id: 1, metadata: {} }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
    }),
    functions: {
      invoke: vi.fn().mockImplementation(async (functionName, { body }) => {
        // Mock the RapidAPI call
        const formData = new FormData();
        formData.append('file', body.pdf_data);
        formData.append('language', 'eng');

        const response = await fetch('https://pdf-to-text-api.p.rapidapi.com/pdf-to-text', {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': process.env.VITE_RAPIDAPI_HOST || ''
          },
          body: formData
        });
        
        const data = await response.json();
        return { data, error: null };
      })
    }
  }
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: vi.fn()
}));

describe('useUnifiedDocumentUpload', () => {
  const mockClientId = 'test-client-id';
  let mockFile: File;

  beforeEach(() => {
    // Create a mock PDF file
    mockFile = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    // Reset all mocks
    vi.clearAllMocks();

    // Mock successful RapidAPI response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Extracted text from PDF', pages: 1 })
    });
  });

  it('should handle PDF upload and processing successfully', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onProgress = vi.fn();

    // Setup FileReader mock
    const mockReadAsDataURL = vi.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      result: 'base64-encoded-content',
      onload: null as any
    };

    // Mock FileReader constructor
    const FileReaderMock = vi.fn(() => mockFileReader);
    vi.stubGlobal('FileReader', FileReaderMock);

    const { result } = renderHook(() =>
      useUnifiedDocumentUpload({
        clientId: mockClientId,
        onSuccess,
        onError,
        onProgress
      })
    );

    // Start upload
    const uploadPromise = result.current.upload(mockFile);

    // Simulate FileReader completion
    mockFileReader.onload?.({ target: { result: 'base64-encoded-content' } } as any);

    const uploadResult = await uploadPromise;

    // Verify successful upload
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.documentId).toBeDefined();
    expect(uploadResult.url).toBe('https://test-url.com');
    
    // Verify RapidAPI call
    expect(mockFetch).toHaveBeenCalledWith(
      'https://pdf-to-text-api.p.rapidapi.com/pdf-to-text',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-RapidAPI-Key': 'test-api-key',
          'X-RapidAPI-Host': 'pdf-to-text-api.p.rapidapi.com'
        }),
        body: expect.any(FormData)
      })
    );
    
    // Verify toast was called
    expect(toast).toHaveBeenCalledWith('Processing PDF document...', expect.any(Object));
    
    // Verify callbacks
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle upload errors gracefully', async () => {
    // Mock storage upload to fail
    const mockFrom = vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') }),
      getPublicUrl: vi.fn()
    });
    vi.spyOn(supabase.storage, 'from').mockImplementation(mockFrom);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useUnifiedDocumentUpload({
        clientId: mockClientId,
        onError
      })
    );

    const uploadResult = await result.current.upload(mockFile);
    
    expect(uploadResult.success).toBe(false);
    expect(uploadResult.error).toBe('Storage upload failed: Upload failed');
    expect(onError).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle PDF processing errors gracefully', async () => {
    // Mock RapidAPI to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid PDF format or corrupted file' })
    });

    const onError = vi.fn();
    
    // Setup FileReader mock
    const mockReadAsDataURL = vi.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      result: 'base64-encoded-content',
      onload: null as any
    };

    // Mock FileReader constructor
    const FileReaderMock = vi.fn(() => mockFileReader);
    vi.stubGlobal('FileReader', FileReaderMock);

    const { result } = renderHook(() =>
      useUnifiedDocumentUpload({
        clientId: mockClientId,
        onError
      })
    );

    // Start upload
    const uploadPromise = result.current.upload(mockFile);

    // Simulate FileReader completion
    mockFileReader.onload?.({ target: { result: 'base64-encoded-content' } } as any);

    const uploadResult = await uploadPromise;
    
    expect(uploadResult.success).toBe(true); // Upload still succeeds
    expect(uploadResult.documentId).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(toast).toHaveBeenCalledWith('PDF text extraction failed. The document was uploaded but text extraction will need to be retried.', expect.any(Object));
    
    // Verify RapidAPI call was made with correct headers
    expect(mockFetch).toHaveBeenCalledWith(
      'https://pdf-to-text-api.p.rapidapi.com/pdf-to-text',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-RapidAPI-Key': 'test-api-key',
          'X-RapidAPI-Host': 'pdf-to-text-api.p.rapidapi.com'
        }),
        body: expect.any(FormData)
      })
    );
  });
});
