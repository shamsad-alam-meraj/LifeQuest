/** An error whose message is safe to show to the user. Anything else is logged and replaced by a generic message. */
export class AppError extends Error {
  constructor(message: string, public code: 'invalid' | 'forbidden' | 'conflict' | 'rate_limited' | 'unavailable' = 'invalid') { super(message); }
}
