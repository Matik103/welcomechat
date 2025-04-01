
/**
 * Custom error classes for the application
 */

export class LlamaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlamaParseError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class UrlProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlProcessingError';
  }
}
