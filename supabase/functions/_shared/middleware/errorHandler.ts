
import { corsHeaders } from "./cors.ts";

// Error codes for better error handling
export const errorCodes = {
  UNAUTHORIZED: 'unauthorized',
  INVALID_INPUT: 'invalid_input',
  DATABASE_ERROR: 'database_error',
  NOT_FOUND: 'not_found',
  OPENAI_ERROR: 'openai_error',
  DEEPSEEK_ERROR: 'deepseek_error',
  RATE_LIMIT: 'rate_limit',
  INTERNAL_ERROR: 'internal_error'
};

// Custom error class with additional metadata
export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  context?: any;

  constructor(statusCode: number, message: string, errorCode: string, context?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    this.name = 'AppError';
  }
}

// Unified error handler for edge functions
export function handleError(error: unknown) {
  console.error("Error caught by handleError:", error);
  
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.errorCode,
        context: error.context,
      }),
      {
        status: error.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Handle other types of errors
  const message = error instanceof Error ? error.message : "An unknown error occurred";
  
  return new Response(
    JSON.stringify({
      error: message,
      code: errorCodes.INTERNAL_ERROR,
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
