
export class OpenAIAssistantError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'OpenAIAssistantError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
} 
