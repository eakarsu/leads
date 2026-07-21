export class LeadOperationsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'LeadOperationsError';
  }
}

export function asLeadOperationsError(error: unknown): LeadOperationsError {
  if (error instanceof LeadOperationsError) return error;
  return new LeadOperationsError('INTERNAL_ERROR', 'The operation could not be completed', 500);
}
