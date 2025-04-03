import { corsHeaders } from "./cors.ts";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleError = (error: unknown): Response => {
  console.error("Error:", error);

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details,
      }),
      {
        status: error.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Handle unexpected errors
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
};

export const errorCodes = {
  INVALID_INPUT: "INVALID_INPUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  OPENAI_ERROR: "OPENAI_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCode = typeof errorCodes[keyof typeof errorCodes]; 