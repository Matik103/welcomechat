
// FirecrawlService.ts handles URL validation and crawling
export class FirecrawlService {
  // Validate URL - simple checking now
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }
}
