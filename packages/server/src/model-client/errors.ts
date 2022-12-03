// Error class, add tests when it's more meaningful
/* c8 ignore start */
export class ModelClientError extends Error {
  constructor(public readonly code: 'entity_not_found', message = 'ModelClient error occurred.') {
    super(message);
  }
}
/* c8 ignore end */
